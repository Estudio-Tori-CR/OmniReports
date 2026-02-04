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
      response.message = "Success";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Invalid Credentials";
    }

    return response;
  }

  public async GetUser(userId: string) {
    const result = await this.dal.GetUser(userId);
    const response = new BaseResponse<User>();
    response.isSuccess = true;
    if (result) {
      response.isSuccess = true;
      response.message = "Success";
      response.body = result;
    } else if (userId !== "") {
      response.isSuccess = false;
      response.message = "Information Not Found";
    }

    return response;
  }

  public async GetUsers(filter: string | null) {
    const result = await this.dal.GetUsers(filter);
    const response = new BaseResponse<User[]>();
    if (result) {
      response.isSuccess = true;
      response.message = "Success";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Information Not Found";
    }

    return response;
  }

  public async InsertUser(body: User) {
    const response = new BaseResponse<null>();
    const existingUser = await this.dal.ValidateEmail(body.email);
    if (existingUser) {
      response.isSuccess = false;
      response.message = "User already exists";
      return response;
    }

    const { hash, password } = new Miselanius().GenerateRandomPassword();
    body.password = hash;
    const result = await this.dal.InsertUser(body);
    if (result) {
      try {
        const mail = new Mail();
        await mail.SendMail({
          to: body.email,
          subject: "Welcome to OmniReports",
          html: `<p>Hello ${body.firstName} ${body.lastName},</p><p>Your account has been created successfully.</p><p>Your temporary password is: ${password}</p>`,
        });
      } catch (err) {
        this.log.log(`Error sending email to ${body.email}: ${err}`, "error");
        response.isSuccess = false;
        response.message = "User created, but failed to send email.";
      }
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Unexpected Error";
    }

    return response;
  }

  public async UpdateUser(userId: string, body: User) {
    const result = await this.dal.UpdateUser(userId, body);
    const response = new BaseResponse<null>();

    if (result) {
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Updating User";
    }

    return response;
  }

  public async ValidatePassword(currentPassword: string, userId: string) {
    currentPassword = new Encript().Hash(currentPassword);
    const result = await this.dal.ValidatePassword(currentPassword, userId);
    const response = new BaseResponse<User>();
    if (result) {
      response.isSuccess = true;
      response.message = "Success";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Your current password is incorrect";
    }

    return response;
  }

  public async ChangePassword(userId: string, body: User) {
    body.password = new Encript().Hash(body.password);
    const result = await this.dal.UpdateUser(userId, body);
    const response = new BaseResponse<null>();

    if (result) {
      try {
        const mail = new Mail();
        await mail.SendMail({
          to: body.email,
          subject: "Password has been changed in OmniReports",
          html: `<p>Hello ${body.firstName} ${body.lastName},</p><p>Your password has been changed successfully.</p>`,
        });
      } catch (err) {
        this.log.log(`Error sending email to ${body.email}: ${err}`, "error");
      }
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Changing Password";
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
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Inserting Instance";
    }

    return response;
  }

  public async UpdateInstance(instanceId: string, body: Instance) {
    body.connectionString = new Encript().encrypt(body.connectionString);
    const result = await this.dal.UpdateInstance(instanceId, body);
    const response = new BaseResponse<null>();

    if (result) {
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Updating Instance";
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
      response.message = "Success";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Information Not Found";
    }

    return response;
  }

  public async GetInstance(instanceId: string) {
    const result = await this.dal.GetInstance(instanceId);
    const response = new BaseResponse<Instance>();
    response.isSuccess = true;
    if (result) {
      result.connectionString = new Encript().decrypt(result.connectionString);
      response.message = "Success";
      response.body = result;
    } else if (instanceId !== "") {
      response.isSuccess = false;
      response.message = "Information Not Found";
    }

    return response;
  }

  public async InsertReport(body: DBReport) {
    body.querys.map((x) => {
      x.query = new Encript().encrypt(x.query);
    });
    const result = await this.dal.InsertReport(body);
    const response = new BaseResponse<string>();
    if (result) {
      response.body = result.toString();
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Inserting Report";
    }

    return response;
  }

  public async UpdateReport(reportId: string, body: DBReport) {
    body.querys.map((x) => {
      x.query = new Encript().encrypt(x.query);
    });
    const result = await this.dal.UpdateReport(reportId, body);
    const response = new BaseResponse<null>();

    if (result) {
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Updating Report";
    }

    return response;
  }

  public async GetReports(filter: string | null) {
    const result = await this.dal.GetReports(filter);
    const response = new BaseResponse<DBReport[]>();
    if (result) {
      response.isSuccess = true;
      response.message = "Success";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Information Not Found";
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
      response.message = "Success";
      response.body = result;
    } else if (reportId !== "") {
      response.isSuccess = false;
      response.message = "Information Not Found";
    }

    return response;
  }

  public async ExportReport(report: ExportReport) {
    const response = new BaseResponse<ExportReport>();

    const encript = new Encript();
    report.instances = encript.encrypt(JSON.stringify(report.instances));
    report.report = encript.encrypt(JSON.stringify(report.report));
    response.isSuccess = true;
    response.message = "Success";
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
        response.message = "Success";
      } else {
        response.isSuccess = false;
        response.message = "Invalid Information";
      }
    } catch (err) {
      this.log.log(`Error importing report: ${err}`, "error");
      response.isSuccess = false;
      response.message = "Unexpected error or the file is invalid";
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
      for (const userId of usersId) {
        const user = await this.dal.GetUser(userId);
        if (user) {
          const userReports = user.reports || [];
          if (!userReports.includes(reportsId)) {
            userReports.push(reportsId);
          }

          await this.dal.UpdateUser(userId, { ...user, reports: userReports });
        }
      }
      response.isSuccess = true;
      response.message = "Success";
    } catch (err) {
      this.log.log(`Error adding report to user: ${err}`, "error");
      response.isSuccess = false;
      response.message = "Unexpected error adding report to user";
    }

    return response;
  }
}

export default MainBll;
