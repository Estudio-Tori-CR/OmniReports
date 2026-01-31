import UserModel, { User } from "@/app/models/User";
import { ConnectionMongo } from "../connections/mongoDB/connection";
import InstanceModel, { Instance } from "@/app/models/Instance";
import ReportModel, { DBReport } from "@/app/models/Report";
import LogModel, { Log } from "@/app/models/Log";

class MainDal {
  private connection: ConnectionMongo;

  constructor() {
    this.connection = new ConnectionMongo();
  }

  public async LogIn(email: string, password: string) {
    const result = await this.connection.getOne<User>(UserModel, {
      email: email,
      password: password,
      isActive: true,
    });
    return result;
  }

  public async GetUser(userId: string | null) {
    const result = await this.connection.find<User>(UserModel, { _id: userId });
    return result[0];
  }

  public async GetUsers(filter: string | null) {
    const result = await this.connection.find<User>(UserModel);
    return result;
  }

  public async InserUser(body: User) {
    const result = await this.connection.insert<User>(UserModel, body);
    return result;
  }

  public async UpdateUser(userId: string, body: User) {
    const result = await this.connection.update<User>(UserModel, body, {
      _id: userId,
    });
    return result;
  }

  public async ValidatePassword(
    currentPassword: string | null,
    userId: string | null,
  ) {
    const result = await this.connection.find<User>(UserModel, {
      _id: userId,
      password: currentPassword,
    });
    return result[0];
  }

  public async InserInstance(body: Instance) {
    const result = await this.connection.insert<Instance>(InstanceModel, body);
    return result;
  }

  public async UpdateInstance(instanceId: string, body: Instance) {
    const result = await this.connection.update<Instance>(InstanceModel, body, {
      _id: instanceId,
    });
    return result;
  }

  public async GetInstances(filter: string | null) {
    const result = await this.connection.find<Instance>(InstanceModel, {
      isActive: true,
    });
    return result;
  }

  public async GetInstance(instanceId: string | null) {
    const result = await this.connection.find<Instance>(InstanceModel, {
      _id: instanceId,
    });
    return result[0];
  }

  public async InserReport(body: DBReport) {
    const result = await this.connection.insert<DBReport>(ReportModel, body);
    return result;
  }

  public async UpdateReport(reportId: string, body: DBReport) {
    const result = await this.connection.update<DBReport>(ReportModel, body, {
      _id: reportId,
    });
    return result;
  }

  public async GetReports(filter: string | null) {
    const result = await this.connection.find<DBReport>(ReportModel, {
      isActive: true,
    });
    return result;
  }

  public async GetReport(reportId: string | null) {
    const result = await this.connection.find<DBReport>(ReportModel, {
      _id: reportId,
    });
    return result[0];
  }

  public async InserLog(body: Log) {
    const result = await this.connection.insert<Log>(LogModel, body);
    return result;
  }
}

export default MainDal;
