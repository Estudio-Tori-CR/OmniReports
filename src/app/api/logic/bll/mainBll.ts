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

  public async InserUser(body: User) {
    const { hash, password } = new Miselanius().GenerateRandomPassword();
    body.password = hash;
    const result = await this.dal.InserUser(body);
    const response = new BaseResponse<null>();
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
    debugger;
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
      response.isSuccess = true;
      response.message = "Success";
    } else {
      response.isSuccess = false;
      response.message = "Error Changing Password";
    }

    return response;
  }

  public async InserInstance(body: Instance) {
    body.connectionString = new Encript().encrypt(body.connectionString);
    const result = await this.dal.InserInstance(body);
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
    if (result) {
      result.connectionString = new Encript().decrypt(result.connectionString);
      response.isSuccess = true;
      response.message = "Success";
      response.body = result;
    } else {
      response.isSuccess = false;
      response.message = "Information Not Found";
    }

    return response;
  }

  public async InserReport(body: DBReport) {
    body.querys.map((x) => {
      x.query = new Encript().encrypt(x.query);
    });
    const result = await this.dal.InserReport(body);
    const response = new BaseResponse<null>();
    if (result) {
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
    result.querys.map((x) => {
      x.query = new Encript().decrypt(x.query);
    });
    const response = new BaseResponse<DBReport>();
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

  public async ImportReport(report: ExportReport) {
    const response = new BaseResponse<null>();
    try {
      if (report.instances && report.report) {
        const instances = await this.GetInstances(null, true);
        for (let i = 0; i < report.instances.length; i++) {
          const element = report.instances[i];
          if (
            !instances.body?.some(
              (x) =>
                x.connectionString === element.connectionString &&
                x.name === element.name &&
                x.type === element.type,
            )
          ) {
            const tmpId = element._id;
            element._id = undefined;
            const id = await this.InserInstance(element);
            report.report.querys.forEach((y) => {
              if (y.instance === tmpId) {
                y.instance = id.body as string;
              }
            });
          }
        }
        report.report._id = undefined;
        await this.InserReport(report.report);
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
      await this.dal.InserLog(body);
    } catch (err) {
      this.log.log(`Error inserting log: ${err}`, "error");
    }
  }
}

export default MainBll;
