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

class MainBll {
  private dal: MainDal;
  private log: Logs;
  constructor() {
    this.dal = new MainDal();
    this.log = new Logs();
  }

  public async LogIn(email: string, password: string) {
    password = new Encript().Hash(password);
    const result = await this.dal.LogIn(email, password);
    const response = new BaseResponse<User>();
    if (result) {
      response.isSuccess = true;
      response.message = "Sign-in completed successfully.";
      response.body = result;
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
      response.body = result;
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
      response.body = result;
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
          html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to OmniReports</title>
  </head>

  <body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="680" cellpadding="0" cellspacing="0"
            style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 8px 22px rgba(0,0,0,.08);">

            <!-- HEADER -->
            <tr>
              <td style="padding:26px 28px; background: linear-gradient(90deg,#071b2d,#0b2b4a);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="vertical-align: middle;">
                      <img
                        src="${process.env.LOGO_URL ?? ""}"
                        alt="OmniReports"
                        style="height:56px; display:block;"
                      />
                    </td>
                    <td align="right" style="color:#d7ecff; font-size:14px;">
                      Welcome to <b>OmniReports</b>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:28px;">
                <h2 style="margin:0 0 12px 0; font-size:22px; color:#0b2b4a;">
                  Hello ${body.firstName} ${body.lastName}! 👋
                </h2>

                <p style="margin:0 0 18px 0; font-size:15px; color:#2a2a2a; line-height:1.6;">
                  Your <b>OmniReports</b> account has been successfully created. Below you will find your temporary credentials.
                </p>

                <!-- Credentials box -->
                <div style="background:#f0f6ff; border:1px solid #d6e7ff; padding:16px; border-radius:12px;">
                  <p style="margin:0 0 10px 0; font-size:14px; color:#0b2b4a;">
                    <b>Login details</b>
                  </p>

                  <p style="margin:0; font-size:14px; color:#2a2a2a; line-height:1.8;">
                    <b>Username:</b> ${body.email} <br />
                    <b>Temporary password:</b>
                    <span style="font-family: Consolas, monospace; font-size:14px; background:#ffffff; padding:3px 8px; border-radius:8px; border:1px solid #cfe3ff;">
                      ${password}
                    </span>
                  </p>
                </div>

                <p style="margin:18px 0 0 0; font-size:14px; color:#2a2a2a; line-height:1.6;">
                  For your security, you must change this temporary password during your first login.
                </p>

                <!-- CTA -->
                <div style="margin-top:22px; text-align:center;">
                  <a href="${process.env.URL_LOGIN ?? ""}"
                    style="display:inline-block; background:#0c7de8; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:12px; font-weight:bold; font-size:14px;">
                    Sign in
                  </a>
                </div>

                <p style="margin:22px 0 0 0; font-size:12.5px; color:#4b5563; line-height:1.6;">
                  If you did not request this account, please ignore this email or contact us immediately.
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:18px 26px; background:#0b2b4a; color:#b9d9ff; font-size:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      © ${new Date().getFullYear()} <b>OmniReports</b>. All rights reserved.
                    </td>
                    <td align="right">
                      Support: ${process.env.EMAIL_SUPPORT ?? ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
        });
      } catch (err) {
        this.log.log(`Error sending email to ${body.email}: ${err}`, "error");
        response.message =
          "User created successfully, but we could not send the welcome email.";
      }
    } else {
      response.isSuccess = false;
      response.message = "An unexpected error occurred while creating the user.";
    }

    return response;
  }

  public async UpdateUser(userId: string, body: User) {
    const result = await this.dal.UpdateUser(userId, body);
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
    currentPassword = new Encript().Hash(currentPassword);
    const result = await this.dal.ValidatePassword(currentPassword, userId);
    const response = new BaseResponse<User>();
    if (result) {
      response.isSuccess = true;
      response.message = "Current password validated successfully.";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "The current password is incorrect.";
    }

    return response;
  }

  public async ChangePassword(userId: string, body: User, ip: string) {
    body.password = new Encript().Hash(body.password);
    const result = await this.dal.UpdateUser(userId, body);
    const response = new BaseResponse<null>();

    if (result) {
      const user = await this.dal.GetUser(userId);
      try {
        const mail = new Mail();
        await mail.SendMail({
          to: body.email,
          subject: "Password has been changed in OmniReports",
          html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Change Completed - OmniReports</title>
  </head>

  <body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="680" cellpadding="0" cellspacing="0"
            style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 8px 22px rgba(0,0,0,.08);">

            <!-- HEADER -->
            <tr>
              <td style="padding:26px 28px; background: linear-gradient(90deg,#071b2d,#0b2b4a);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="vertical-align: middle;">
                      <img
                        src="${process.env.LOGO_URL ?? ""}"
                        alt="OmniReports"
                        style="height:56px; display:block;"
                      />
                    </td>
                    <td align="right" style="color:#d7ecff; font-size:14px;">
                      Security alert
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:28px;">
                <h2 style="margin:0 0 12px 0; font-size:22px; color:#0b2b4a;">
                  Password changed successfully ✅
                </h2>

                <p style="margin:0 0 18px 0; font-size:15px; color:#2a2a2a; line-height:1.6;">
                  Hello <b>${user?.firstName} ${user?.lastName}</b>, this is a confirmation that the password for your <b>OmniReports</b> account has been changed successfully.
                </p>

                <!-- Info box -->
                <div style="background:#f0f6ff; border:1px solid #d6e7ff; padding:16px; border-radius:12px;">
                  <p style="margin:0 0 10px 0; font-size:14px; color:#0b2b4a;">
                    <b>Event details</b>
                  </p>

                  <p style="margin:0; font-size:14px; color:#2a2a2a; line-height:1.8;">
                    <b>Account:</b> ${body.email}<br />
                    <b>Date:</b> ${new Date().toLocaleDateString()}<br />
                    <b>Time:</b> ${new Date().toLocaleTimeString()}<br />
                    <b>IP Address:</b> ${ip}
                  </p>
                </div>

                <!-- Security warning -->
                <div style="margin-top:22px; padding:16px; border-radius:12px; background:#fff7e6; border:1px solid #ffd27d;">
                  <p style="margin:0 0 8px 0; font-size:14px; color:#5a3a00;">
                    <b>⚠ If you did not make this change</b>
                  </p>

                  <p style="margin:0; font-size:14px; color:#5a3a00; line-height:1.6;">
                    If you did not request this change, please contact our support team immediately to secure your account.
                  </p>
                </div>

                <p style="margin:22px 0 0 0; font-size:12.5px; color:#4b5563; line-height:1.6;">
                  This email is for notification purposes only. Please do not reply to this message.
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:18px 26px; background:#0b2b4a; color:#b9d9ff; font-size:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      © ${new Date().getFullYear()} <b>OmniReports</b>. All rights reserved.
                    </td>
                    <td align="right">
                      Support: ${process.env.EMAIL_SUPPORT ?? ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
        });
      } catch (err) {
        this.log.log(`Error sending email to ${body.email}: ${err}`, "error");
      }
      response.isSuccess = true;
      response.message = "Password changed successfully.";
    } else {
      response.isSuccess = false;
      response.message = "Failed to change password.";
    }

    return response;
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

  public async GetInstance(instanceId: string) {
    const result = await this.dal.GetInstance(instanceId);
    const response = new BaseResponse<Instance>();
    response.isSuccess = true;
    if (result) {
      result.connectionString = new Encript().decrypt(result.connectionString);
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
    const miselanius = new Miselanius();
    for (const item of body.querys) {
      if (miselanius.CheckInvalidSql(item.query)) {
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
    const miselanius = new Miselanius();
    for (const item of body.querys) {
      if (miselanius.CheckInvalidSql(item.query)) {
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

  public async GetReports(filter: string | null, userId: string) {
    const result = await this.dal.GetReports(null);
    const response = new BaseResponse<DBReport[]>();

    if (result) {
      response.isSuccess = true;
      response.message = "Reports loaded successfully.";
      response.body = [];

      if (filter?.includes("ADMIN") || filter === "") {
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
        for (const item of (report.report as DBReport).querys) {
          const miselanius = new Miselanius();
          if (miselanius.CheckInvalidSql(item.query)) {
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
            debugger;
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
        new Mail().SendMail({
          subject: "Your OmniReports verification code",
          to: user?.email as string,
          html: `<!DOCTYPE html>

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Verification Code - OmniReports</title>
  </head>

  <body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb; padding:24px 0;">
      <tr>
        <td align="center">
      <!-- MAIN CONTAINER -->
      <table width="680" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 22px rgba(0,0,0,.08);">

        <!-- HEADER -->
        <tr>
          <td style="padding:26px 28px; background:#071b2d;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" valign="middle">
                  <img
                    src="${process.env.LOGO_URL ?? ""}"
                    alt="OmniReports"
                    style="height:56px; display:block;"
                  />
                </td>
                <td align="right" valign="middle"
                  style="color:#d7ecff; font-size:14px; font-weight:500;">
                  Two-Factor Authentication
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:28px;">
            <h2 style="margin:0 0 12px 0; font-size:22px; color:#0b2b4a;">
              Your verification code 🔐
            </h2>

            <p style="margin:0 0 18px 0; font-size:15px; color:#2a2a2a; line-height:1.6;">
              Hello <b>${user?.firstName} ${user?.lastName}</b>,  
              use the verification code below to complete your sign-in to <b>OmniReports</b>.
            </p>

            <!-- TOKEN BOX -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="margin:20px 0; background:#f0f6ff; border:1px solid #d6e7ff; border-radius:14px;">
              <tr>
                <td align="center" style="padding:22px;">
                  <p style="margin:0 0 8px 0; font-size:14px; color:#0b2b4a;">
                    Your verification code
                  </p>
                  <p style="margin:0; font-size:30px; letter-spacing:6px; font-weight:bold; color:#071b2d;">
                    ${autheticator.token}
                  </p>
                  <p style="margin:10px 0 0 0; font-size:13px; color:#4b5563;">
                    This code will expire in <b>15 minutes</b>.
                  </p>
                </td>
              </tr>
            </table>

            <!-- INFO BOX -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0 0 10px 0; font-size:14px; color:#0b2b4a;">
                    <b>Request details</b>
                  </p>
                  <p style="margin:0; font-size:14px; color:#2a2a2a; line-height:1.8;">
                    <b>Account:</b> ${user?.email}<br />
                    <b>Date:</b> ${new Date().toLocaleDateString()}<br />
                    <b>Time:</b> ${new Date().toLocaleTimeString()}<br />
                    <b>IP Address:</b> ${ip}
                  </p>
                </td>
              </tr>
            </table>

            <!-- WARNING -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="margin-top:22px; background:#fff7e6; border:1px solid #ffd27d; border-radius:12px;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0 0 8px 0; font-size:14px; color:#5a3a00;">
                    <b>⚠ Didn’t request this code?</b>
                  </p>
                  <p style="margin:0; font-size:14px; color:#5a3a00; line-height:1.6;">
                    If you did not request this verification code, please ignore this email or contact our support team immediately.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:22px 0 0 0; font-size:12.5px; color:#4b5563; line-height:1.6;">
              This code is confidential. Do not share it with anyone.  
              OmniReports staff will never ask you for this code.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:18px 26px; background:#0b2b4a; color:#b9d9ff; font-size:12px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  © ${new Date().getFullYear()} <b>OmniReports</b>. All rights reserved.
                </td>
                <td align="right">
                  Support: ${process.env.EMAIL_SUPPORT ?? ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
  </body>
</html>`,
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
        response.message =
          "Verification code generated, but the email could not be sent.";
      }
    } catch (err) {
      this.log.log(`Error sending token: ${err}`, "error");
      response.isSuccess = false;
      response.message = "Failed to generate or send the verification code.";
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
      const currentToken = await this.dal.ValidateAuthenticator(userId, token);
      if (!currentToken) {
        response.isSuccess = false;
        response.message = "The verification code is invalid or has expired.";
      } else {
        await this.ExpireAuthenticatorByUser(
          userId,
          currentToken?._id?.toString(),
        );

        response.message = "Verification code validated successfully.";
        response.body = (await this.GetUser(userId)).body;
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
}

export default MainBll;
