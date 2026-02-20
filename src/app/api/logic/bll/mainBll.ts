import { User } from "@/app/models/User";
import MainDal from "../dal/mainDal";
import Miselanius from "../../utilities/Miselanius";
import Encript from "../../utilities/Encript";
import BaseResponse from "@/app/models/baseResponse";
import { Instance } from "@/app/models/Instance";
import { DBReport, ExportReport } from "@/app/models/Report";
import Mail from "../../utilities/Mail";
import Logs from "../../utilities/Logs";
import { Log } from "@/app/models/Log";
import AuthenticatorModel, {
  Authenticator,
  AuthenticatorResp,
} from "@/app/models/authenticator";
import { DirectoryReports } from "@/app/models/directory";
import SqlScan from "../../utilities/SqlScan";
import { Role } from "@/app/interfaces/Roles";

class MainBll {
  private dal: MainDal;
  private log: Logs;
  constructor() {
    this.dal = new MainDal();
    this.log = new Logs();
  }

  private isModernPasswordHash(hash: string | null | undefined): boolean {
    return typeof hash === "string" && hash.startsWith("scrypt$");
  }

  private sanitizeUser(user: User | null | undefined): User | null {
    if (!user) return null;
    return {
      ...user,
      password: "",
    };
  }

  private sanitizeUsers(users: User[] | null | undefined): User[] {
    return (users ?? [])
      .map((user) => this.sanitizeUser(user))
      .filter((user): user is User => user !== null);
  }

  public async LogIn(email: string, password: string) {
    const normalizeEmail = (email ?? "").trim().toLowerCase();
    const providedPassword = password ?? "";
    const encrypt = new Encript();

    const user = await this.dal.ValidateEmail(normalizeEmail);
    const passwordValid = user
      ? encrypt.VerifyPassword(providedPassword, user.password)
      : false;

    const isBlocked = await this.CountCredentialsIntent(
      normalizeEmail,
      passwordValid,
    );

    const response = new BaseResponse<User>();
    if (user && passwordValid && user.isActive) {
      if (!this.isModernPasswordHash(user.password)) {
        await this.dal.UpdateUser(user._id?.toString() as string, {
          password: encrypt.HashPassword(providedPassword),
        });
      }

      response.isSuccess = true;
      response.message = "Sign-in completed successfully.";
      response.body = this.sanitizeUser(user) as User;
    } else if (user && !user.isActive) {
      response.isSuccess = false;
      response.message = "Your user is blocked. Please contact support.";
    } else if (isBlocked) {
      response.isSuccess = false;
      response.message = "Your user is blocked. Please contact support.";
    } else {
      response.isSuccess = false;
      response.message = "Invalid email or password.";
    }

    return response;
  }

  public async GetUser(userId: string) {
    const result = await this.dal.GetUser(userId);
    const response = new BaseResponse<User>();
    response.isSuccess = true;
    if (result) {
      response.isSuccess = true;
      response.message = "User details loaded successfully.";
      response.body = this.sanitizeUser(result) as User;
    } else if (userId !== "") {
      response.isSuccess = false;
      response.message = "User not found.";
    }

    return response;
  }

  public async GetUsers(filter: string | null) {
    const result = await this.dal.GetUsers(filter);
    const response = new BaseResponse<User[]>();
    if (result) {
      response.isSuccess = true;
      response.message = "Users loaded successfully.";
      response.body = this.sanitizeUsers(result);
    } else {
      response.isSuccess = false;
      response.message = "No users were found.";
    }

    return response;
  }

  public async InsertUser(body: User) {
    const response = new BaseResponse<null>();
    const existingUser = await this.dal.ValidateEmail(body.email);
    if (existingUser) {
      response.isSuccess = false;
      response.message = "User already exists.";
      return response;
    }

    const { hash, password } = new Miselanius().GenerateRandomString(
      parseInt(process.env.PASSWORD_LENGTH ?? "8"),
    );
    body.password = hash;
    const result = await this.dal.InsertUser(body);
    if (result) {
      response.isSuccess = true;
      response.message = "User created successfully.";
      try {
        const mail = new Mail();
        await mail.SendMail({
          to: body.email,
          subject: "Welcome to OmniReports",
          templateName: "welcome",
          templateData: {
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            password,
            URL_LOGIN: process.env.URL_LOGIN ?? "",
            LOGO_URL: process.env.LOGO_URL ?? "",
            EMAIL_SUPPORT: process.env.EMAIL_SUPPORT ?? "",
          },
        });
      } catch (err) {
        this.log.log(`Error sending email to ${body.email}: ${err}`, "error");
        response.message =
          "User created successfully, but we could not send the welcome email.";
      }
    } else {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while creating the user.";
    }

    return response;
  }

  public async CanBootstrap() {
    const hasUsers = await this.dal.HasUsers();
    return !hasUsers;
  }

  public async BootstrapCreateFirstUser(body: User) {
    const response = new BaseResponse<null>();

    const canBootstrap = await this.CanBootstrap();
    if (!canBootstrap) {
      response.isSuccess = false;
      response.message = "Bootstrap is disabled because users already exist.";
      return response;
    }

    const email = body.email?.trim();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const password = body.password?.trim();

    if (!email || !firstName || !lastName || !password) {
      response.isSuccess = false;
      response.message =
        "firstName, lastName, email and password are required for bootstrap.";
      return response;
    }

    const existingUser = await this.dal.ValidateEmail(email);
    if (existingUser) {
      response.isSuccess = false;
      response.message = "User already exists.";
      return response;
    }

    body.firstName = firstName;
    body.lastName = lastName;
    body.email = email;
    body.password = new Encript().HashPassword(password);
    body.roles = "ADMIN";
    body.reports = body.reports ?? [];
    body.countIntents = 0;
    body.isActive = true;

    const result = await this.dal.InsertUser(body);
    if (result) {
      response.isSuccess = true;
      response.message = "Initial admin user created successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to create initial admin user.";
    }

    return response;
  }

  public async UpdateUser(userId: string, body: Partial<User>) {
    const payload: Partial<User> = { ...body };

    if (typeof payload.password === "string") {
      const candidatePassword = payload.password.trim();
      if (!candidatePassword) {
        delete payload.password;
      } else {
        const looksLegacyHash = /^[a-f0-9]{64}$/i.test(candidatePassword);
        if (!this.isModernPasswordHash(candidatePassword) && !looksLegacyHash) {
          payload.password = new Encript().HashPassword(candidatePassword);
        }
      }
    }

    const result = await this.dal.UpdateUser(userId, payload);
    const response = new BaseResponse<null>();

    if (result) {
      response.isSuccess = true;
      response.message = "User updated successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to update user.";
    }

    return response;
  }

  public async ValidatePassword(currentPassword: string, userId: string) {
    const user = await this.dal.GetUser(userId);
    const encrypt = new Encript();
    const response = new BaseResponse<User>();
    const isValid = user
      ? encrypt.VerifyPassword(currentPassword, user.password)
      : false;

    if (user && isValid) {
      if (!this.isModernPasswordHash(user.password)) {
        await this.dal.UpdateUser(userId, {
          password: encrypt.HashPassword(currentPassword),
        });
      }

      response.isSuccess = true;
      response.message = "Current password validated successfully.";
      response.body = this.sanitizeUser(user) as User;
    } else {
      response.isSuccess = false;
      response.message = "The current password is incorrect.";
    }

    return response;
  }

  public async ChangePassword(userId: string, newPassword: string, ip: string) {
    const user = await this.dal.GetUser(userId);
    const response = new BaseResponse<null>();
    if (!user) {
      response.isSuccess = false;
      response.message = "User not found.";
      return response;
    }

    const result = await this.dal.UpdateUser(userId, {
      password: new Encript().HashPassword(newPassword),
    });

    if (result) {
      try {
        const mail = new Mail();
        await mail.SendMail({
          to: user.email,
          subject: "Password has been changed in OmniReports",
          templateName: "password_changed",
          templateData: {
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            email: user.email,
            ip,
            DATE: new Date().toLocaleDateString(),
            TIME: new Date().toLocaleTimeString(),
            LOGO_URL: process.env.LOGO_URL ?? "",
            EMAIL_SUPPORT: process.env.EMAIL_SUPPORT ?? "",
          },
        });
      } catch (err) {
        this.log.log(`Error sending email to ${user.email}: ${err}`, "error");
      }
      response.isSuccess = true;
      response.message = "Password changed successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to change password.";
    }

    return response;
  }

  public async GetUserByEmail(email: string) {
    return this.dal.ValidateEmail(email);
  }

  public async InsertInstance(body: Instance) {
    body.connectionString = new Encript().encrypt(body.connectionString);
    const result = await this.dal.InsertInstance(body);
    const response = new BaseResponse<string>();
    if (result) {
      response.body = result;
      response.isSuccess = true;
      response.message = "Instance created successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to create instance.";
    }

    return response;
  }

  public async UpdateInstance(instanceId: string, body: Instance) {
    body.connectionString = new Encript().encrypt(body.connectionString);
    const result = await this.dal.UpdateInstance(instanceId, body);
    const response = new BaseResponse<null>();

    if (result) {
      response.isSuccess = true;
      response.message = "Instance updated successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to update instance.";
    }

    return response;
  }

  public async GetInstances(filter: string | null, isExport: boolean) {
    const result = await this.dal.GetInstances(filter);

    if (isExport) {
      const encrypt = new Encript();
      result.forEach((x) => {
        x.connectionString = encrypt.decrypt(x.connectionString);
      });
    }

    const response = new BaseResponse<Instance[]>();
    if (result) {
      response.isSuccess = true;
      response.message = "Instances loaded successfully.";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "No instances were found.";
    }

    return response;
  }

  public async GetInstance(instanceId: string, isAdmin: boolean = true) {
    const result = await this.dal.GetInstance(instanceId);
    const response = new BaseResponse<Instance>();
    response.isSuccess = true;
    if (result) {
      if (isAdmin) {
        result.connectionString = new Encript().decrypt(
          result.connectionString,
        );
      }
      response.message = "Instance loaded successfully.";
      response.body = result;
    } else if (instanceId !== "") {
      response.isSuccess = false;
      response.message = "Instance not found.";
    }

    return response;
  }

  public async InsertReport(body: DBReport) {
    const response = new BaseResponse<string>();
    const sqlScan = new SqlScan();
    for (const item of body.querys) {
      const instance = (await this.GetInstance(item.instance as string)).body;
      const isValid: boolean = sqlScan.validateReadOnlySql(
        item.query,
        instance?.type as string,
      ).ok;
      if (!isValid) {
        response.isSuccess = false;
        response.message =
          "The query contains unsafe SQL statements and cannot be saved.";
        return response;
      }
    }

    body.querys.map((x) => {
      x.query = new Encript().encrypt(x.query);
    });
    const result = await this.dal.InsertReport(body);
    if (result) {
      response.body = result.toString();
      response.isSuccess = true;
      response.message = "Report created successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to create report.";
    }

    return response;
  }

  public async UpdateReport(reportId: string, body: DBReport) {
    const response = new BaseResponse<null>();
    const sqlScan = new SqlScan();
    for (const item of body.querys) {
      const instance = (await this.GetInstance(item.instance as string)).body;
      const isValid: boolean = sqlScan.validateReadOnlySql(
        item.query,
        instance?.type as string,
      ).ok;
      if (!isValid) {
        response.isSuccess = false;
        response.message =
          "The query contains unsafe SQL statements and cannot be saved.";
        return response;
      }
    }

    body.querys.map((x) => {
      x.query = new Encript().encrypt(x.query);
    });
    const result = await this.dal.UpdateReport(reportId, body);

    if (result) {
      response.isSuccess = true;
      response.message = "Report updated successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to update report.";
    }

    return response;
  }

  public async GetReports(filter: Role[] | null, userId: string) {
    const result = await this.dal.GetReports(null);
    const response = new BaseResponse<DBReport[]>();

    if (result) {
      response.isSuccess = true;
      response.message = "Reports loaded successfully.";
      response.body = [];

      if (filter?.includes("ADMIN") || filter === null) {
        response.body = result;
      } else {
        const user = await this.dal.GetUser(userId);
        user?.reports?.forEach((reportId) => {
          const report = result.find((r) => r._id?.toString() === reportId);
          if (report) {
            response.body?.push(report);
          }
        });
      }
    } else {
      response.isSuccess = false;
      response.message = "No reports were found.";
    }

    return response;
  }

  public async GetReport(reportId: string) {
    const result = await this.dal.GetReport(reportId);
    result?.querys.map((x) => {
      x.query = new Encript().decrypt(x.query);
    });
    const response = new BaseResponse<DBReport>();
    response.isSuccess = true;
    if (result) {
      response.isSuccess = true;
      response.message = "Report loaded successfully.";
      response.body = result;
    } else if (reportId !== "") {
      response.isSuccess = false;
      response.message = "Report not found.";
    }

    return response;
  }

  public async ExportReport(report: ExportReport) {
    const response = new BaseResponse<ExportReport>();

    const encript = new Encript();
    report.instances = encript.encrypt(JSON.stringify(report.instances));
    report.report = encript.encrypt(JSON.stringify(report.report));
    response.isSuccess = true;
    response.message = "Report exported successfully.";
    response.body = report;

    return response;
  }

  public async ImportReport(report: ExportReport) {
    const response = new BaseResponse<null>();

    const encrypt = new Encript();
    if (report.isEncrypted) {
      report.instances = JSON.parse(
        encrypt.decrypt(JSON.stringify(report.instances)),
      );
      report.report = JSON.parse(
        encrypt.decrypt(JSON.stringify(report.report)),
      );
    }
    try {
      if (report.instances && report.report) {
        const sqlScan = new SqlScan();
        for (const item of (report.report as DBReport).querys) {
          const instance = (await this.GetInstance(item.instance as string))
            .body;
          const isValid: boolean = sqlScan.validateReadOnlySql(
            item.query,
            instance?.type as string,
          ).ok;
          if (!isValid) {
            response.isSuccess = false;
            response.message =
              "The import contains unsafe SQL statements and cannot be processed.";
            return response;
          }
        }

        const instances = await this.GetInstances(null, true);
        for (let i = 0; i < report.instances.length; i++) {
          const element = report.instances[i] as Instance;
          if (
            !instances.body?.some(
              (x) =>
                x.connectionString === element.connectionString &&
                x.name === element.name &&
                x.type === element.type,
            ) ||
            instances.body === undefined ||
            instances.body.length === 0 ||
            instances.body === null
          ) {
            const tmpId = element._id;
            element._id = undefined;
            const id = await this.InsertInstance(element);
            (report.report as DBReport).querys.forEach((y) => {
              if (y.instance === tmpId) {
                y.instance = id.body as string;
              }
            });
          }
        }
        (report.report as DBReport)._id = undefined;
        await this.InsertReport(report.report as DBReport);
        response.isSuccess = true;
        response.message = "Report imported successfully.";
      } else {
        response.isSuccess = false;
        response.message = "The import file content is invalid.";
      }
    } catch (err) {
      this.log.log(`Error importing report: ${err}`, "error");
      response.isSuccess = false;
      response.message =
        "Failed to import report. The file is invalid or corrupted.";
    }

    return response;
  }

  public async InserLog(body: Log) {
    try {
      await this.dal.InsertLog(body);
    } catch (err) {
      this.log.log(`Error inserting log: ${err}`, "error");
    }
  }

  public async AddReportToUser(reportsId: string, usersId: string[]) {
    const response = new BaseResponse<null>();
    try {
      const users = await this.dal.GetUsers(null);
      for (const userId of users) {
        const userReports = userId.reports || [];
        if (usersId.includes(userId._id?.toString() || "")) {
          if (!userReports.includes(reportsId)) {
            userReports.push(reportsId);
          }
        } else {
          const index = userReports.indexOf(reportsId);
          if (index > -1) {
            userReports.splice(index, 1);
          }
        }

        await this.dal.UpdateUser(userId._id?.toString() || "", {
          ...userId,
          reports: userReports,
        });
      }
      response.isSuccess = true;
      response.message = "Report access updated successfully.";
    } catch (err) {
      this.log.log(`Error adding report to user: ${err}`, "error");
      response.isSuccess = false;
      response.message = "Failed to update report access for users.";
    }

    return response;
  }

  public async SendAuthenticator(userId: string, ip: string) {
    const response = new BaseResponse<AuthenticatorResp>();
    try {
      const user = await this.dal.GetUser(userId);
      if (!user || !user.isActive) {
        response.isSuccess = false;
        response.message = "Unable to generate verification code.";
        return response;
      }

      const tokenLength = parseInt(process.env.TOKEN_LENGTH ?? "6");

      const expireDate: Date = new Date(Date.now() + 15 * 60 * 1000);
      const autheticator = new AuthenticatorModel({
        expiredDate: expireDate,
        token: new Miselanius().GenerateRandomString(
          tokenLength,
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        ).password,
        user: userId,
      });

      await this.ExpireAuthenticatorByUser(userId);
      await this.dal.InsertAuthenticator(autheticator);

      try {
        await new Mail().SendMail({
          subject: "Your OmniReports verification code",
          to: user.email,
          templateName: "authenticator",
          templateData: {
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            token: autheticator.token,
            ip,
            DATE: new Date().toLocaleDateString(),
            TIME: new Date().toLocaleTimeString(),
            LOGO_URL: process.env.LOGO_URL ?? "",
            EMAIL_SUPPORT: process.env.EMAIL_SUPPORT ?? "",
          },
        });

        response.isSuccess = true;
        response.message = "Verification code sent successfully.";
        response.body = {
          expirationDate: expireDate,
          length: tokenLength,
        };
      } catch (err) {
        this.log.log(`Error sending email with token: ${err}`, "error");
        response.isSuccess = false;
        response.message = "Unable to generate verification code.";
      }
    } catch (err) {
      this.log.log(`Error sending token: ${err}`, "error");
      response.isSuccess = false;
      response.message = "Unable to generate verification code.";
    }

    return response;
  }

  public async ExpireAuthenticatorByUser(
    userId: string,
    tokenId: string | null = null,
  ) {
    let currentToken: Authenticator | null;
    if (tokenId) {
      currentToken = await this.dal.GetAuthenticatorByUser(userId);
    } else {
      currentToken = await this.dal.GetAuthenticatorByUser(userId);
    }

    if (currentToken) {
      currentToken.status = "E";
      await this.dal.UpdateAuthenticator(
        currentToken._id as unknown as string,
        currentToken,
      );
    }
  }

  public async ValidateAuthenticator(userId: string, token: string) {
    const response = new BaseResponse<User>();
    response.isSuccess = true;
    try {
      const user = await this.dal.GetUser(userId);
      if (!user) {
        response.isSuccess = false;
        response.message = "The verification code is invalid or has expired.";
        return response;
      }

      if (!user.isActive) {
        response.isSuccess = false;
        response.message = "Your user is blocked. Please contact support.";
        return response;
      }

      const currentToken = await this.dal.ValidateAuthenticator(userId, token);
      if (!currentToken) {
        const isBlocked = await this.CountCredentialsIntent(user.email, false);
        response.isSuccess = false;
        response.message = isBlocked
          ? "Your user is blocked. Please contact support."
          : "The verification code is invalid or has expired.";
      } else {
        await this.CountCredentialsIntent(user.email, true);
        await this.ExpireAuthenticatorByUser(
          userId,
          currentToken?._id?.toString(),
        );

        response.message = "Verification code validated successfully.";
        response.body = this.sanitizeUser(user) as User;
      }
    } catch (err) {
      this.log.log(`Error: ${err}`, "error");
      response.isSuccess = false;
      response.message = "Failed to validate the verification code.";
    }

    return response;
  }

  public async InsertDirectory(body: DirectoryReports) {
    const response = new BaseResponse<null>();
    const result = await this.dal.InsertDirectory(body);
    if (result) {
      response.isSuccess = true;
      response.message =
        "Directory created successfully. It will appear once it contains reports.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to create directory.";
    }

    return response;
  }

  public async GetDirectories() {
    const response = new BaseResponse<DirectoryReports[]>();
    const result = await this.dal.GetDirectories();
    if (result) {
      response.isSuccess = true;
      response.message = "Directories loaded successfully.";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Failed to load directories.";
    }

    return response;
  }

  public async UpdateDirectory(newName: string, path: string, oldName: string) {
    const response = new BaseResponse<null>();
    if (path.at(0) === "/") {
      path = path.substring(1, path.length);
    }
    const result = await this.dal.GetDirectoriesByPath(oldName, path);
    if (result) {
      result.name = newName;
      result.path = result.path.replace(oldName, newName);
      try {
        await this.dal.UpdateDirectory(result._id as unknown as string, result);
        const reports = await this.dal.GetReportsByDirectory(path);

        if (reports) {
          const encrypt = new Encript();
          for (const report of reports) {
            // decrypt queries before updating so UpdateReport doesn't double-encrypt
            report.querys = report.querys.map((q) => ({
              ...q,
              query: encrypt.decrypt(q.query),
            }));
            report.directory = report.directory.replace(oldName, newName);
            await this.UpdateReport(report._id?.toString() as string, report);
          }
        }

        const subDirectories = await this.dal.GetSubdirectoriesByPath(path);

        for (const directory of subDirectories) {
          directory.path = directory.path.replace(oldName, newName);
          await this.dal.UpdateDirectory(
            directory._id as unknown as string,
            directory,
          );
        }

        response.isSuccess = true;
        response.message = "Directory updated successfully.";
      } catch (err) {}
    } else {
      response.isSuccess = false;
      response.message = "Failed to update directory.";
    }

    return response;
  }

  public async GeneratePassword(userId: string, ip: string) {
    const response = new BaseResponse<null>();

    const userResp = await this.GetUser(userId);
    if (!userResp.isSuccess || !userResp.body) {
      this.log.log(`GeneratePassword: user not found: ${userId}`, "error");
      response.isSuccess = false;
      response.message = "User not found.";
      return response;
    }

    try {
      const { hash, password } = new Miselanius().GenerateRandomString(
        parseInt(process.env.PASSWORD_LENGTH ?? "8"),
      );

      const user = userResp.body;
      user.password = hash;

      const updated = await this.dal.UpdateUser(userId, user);
      if (!updated) {
        this.log.log(
          `GeneratePassword: failed to update password for user ${userId}`,
          "error",
        );
        response.isSuccess = false;
        response.message = "Failed to update user password.";
        return response;
      }

      try {
        await new Mail().SendMail({
          to: user.email,
          subject: "Temporary password generated - OmniReports",
          templateName: "password_changed_admin",
          templateData: {
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            email: user.email,
            ip,
            DATE: new Date().toLocaleDateString(),
            TIME: new Date().toLocaleTimeString(),
            LOGO_URL: process.env.LOGO_URL ?? "",
            EMAIL_SUPPORT: process.env.EMAIL_SUPPORT ?? "",
            TEMP_PASSWORD: password,
          },
        });
      } catch (err) {
        this.log.log(
          `GeneratePassword: password updated but failed to send email to ${user.email}: ${err}`,
          "error",
        );
        response.isSuccess = true;
        response.message =
          "Temporary password generated, but email notification failed.";
        return response;
      }
      response.isSuccess = true;
      response.message = "Temporary password generated and emailed to user.";
      return response;
    } catch (err) {
      this.log.log(
        `GeneratePassword: unexpected error for user ${userId}: ${err}`,
        "error",
      );
      response.isSuccess = false;
      response.message = "Error generating temporary password.";
      return response;
    }
  }

  private async CountCredentialsIntent(filter: string, isValid: boolean) {
    const user = await this.dal.GetUserByEmailOrId(filter);
    if (!user) return false;
    if (!user.isActive) return true;

    const currentIntents = user.countIntents ?? 0;
    user.countIntents = isValid ? 0 : currentIntents + 1;

    let isBlocked = false;
    if (user.countIntents >= 5) {
      user.isActive = false;
      isBlocked = true;
    }

    await this.UpdateUser(user._id as unknown as string, user);
    return isBlocked;
  }
}

export default MainBll;
