import UserModel, { User } from "@/app/models/User";
import { ConnectionMongo } from "../connections/mongoDB/connection";
import InstanceModel, { Instance } from "@/app/models/Instance";
import ReportModel, { DBReport, ExportReport } from "@/app/models/Report";
import LogModel, { Log } from "@/app/models/Log";
import AuthenticatorModel, { Authenticator } from "@/app/models/authenticator";
import DirectoryReportsModel, {
  DirectoryReports,
} from "@/app/models/directory";
import BinnacleModel, { Binnacle } from "@/app/models/binnacle";
import ExportReportModel, {
  PendingExportReport,
} from "@/app/models/exportReports";
import PendingExportReportModel from "@/app/models/exportReports";
import { Types } from "mongoose";

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
    if (!userId) return null;
    const result = await this.connection.find<User>(UserModel, { _id: userId });
    return result[0];
  }

  public async GetUserByEmailOrId(filter: string | null) {
    if (!filter) return null;

    const result = Types.ObjectId.isValid(filter)
      ? await this.connection.find<User>(UserModel, {
          $or: [{ _id: filter }, { email: filter }],
        })
      : await this.connection.find<User>(UserModel, {
          email: filter,
        });

    return result[0];
  }

  public async ValidateEmail(email: string | null) {
    if (!email) return null;
    const result = await this.connection.find<User>(UserModel, {
      email: email,
    });
    return result[0];
  }

  public async GetUsers(filter: string | null) {
    const result = await this.connection.find<User>(UserModel);
    return result;
  }

  public async HasUsers() {
    const result = await this.connection.getOne<User>(UserModel, {});
    return result !== null;
  }

  public async InsertUser(body: User) {
    const result = await this.connection.insert<User>(UserModel, body);
    return result;
  }

  public async UpdateUser(userId: string, body: Partial<User>) {
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

  public async InsertInstance(body: Instance) {
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
    if (!instanceId) return null;
    const result = await this.connection.find<Instance>(InstanceModel, {
      _id: instanceId,
    });
    return result[0];
  }

  public async InsertReport(body: DBReport) {
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
    if (!reportId) return null;
    const result = await this.connection.find<DBReport>(ReportModel, {
      _id: reportId,
    });
    return result[0];
  }

  public async InsertLog(body: Log) {
    const result = await this.connection.insert<Log>(LogModel, body);
    return result;
  }

  public async InsertBinnacle(body: Partial<Binnacle>) {
    try {
      const result = await this.connection.insert<Binnacle>(
        BinnacleModel,
        body,
      );
      return result;
    } catch (err) {
      const mongoErr = err as { code?: number; message?: string };
      const isDuplicateKey = mongoErr.code === 11000;
      const message = mongoErr.message ?? "";
      const indexMatch = message.match(/index:\s+([^\s]+)\s+dup key/i);
      let indexName = indexMatch?.[1] ?? "";
      if (!indexName && message.includes("dup key: { query:")) {
        indexName = "query_1";
      } else if (!indexName && message.includes("dup key: { user:")) {
        indexName = "user_1";
      }
      const legacyIndexes = new Set(["user_1", "query_1"]);

      if (!isDuplicateKey || !legacyIndexes.has(indexName)) {
        throw err;
      }

      try {
        await BinnacleModel.collection.dropIndex(indexName);
      } catch (dropErr) {
        const dropMessage =
          (dropErr as { message?: string })?.message?.toLowerCase() ?? "";
        const indexNotFound =
          dropMessage.includes("index not found") ||
          dropMessage.includes("indexnotfound");
        if (!indexNotFound) {
          throw dropErr;
        }
      }

      const result = await this.connection.insert<Binnacle>(
        BinnacleModel,
        body,
      );
      return result;
    }
  }

  public async InsertAuthenticator(body: Authenticator) {
    const result = await this.connection.insert<Authenticator>(
      AuthenticatorModel,
      body,
    );
    return result;
  }

  public async UpdateAuthenticator(
    authenticatorId: string,
    body: Authenticator,
  ) {
    const result = await this.connection.update<Authenticator>(
      AuthenticatorModel,
      body,
      {
        _id: authenticatorId,
      },
    );
    return result;
  }

  public async GetAuthenticatorByUser(userId: string | null) {
    if (!userId) return null;
    const result = await this.connection.find<Authenticator>(
      AuthenticatorModel,
      {
        user: userId,
        status: "S",
      },
    );
    return result[0];
  }

  public async ValidateAuthenticator(userId: string | null, token: string) {
    if (!userId) return null;
    const result = await this.connection.find<Authenticator>(
      AuthenticatorModel,
      {
        user: userId,
        status: "S",
        token: token,
        expiredDate: { $gte: new Date(Date.now()) },
      },
    );
    return result[0];
  }

  public async InsertDirectory(body: DirectoryReports) {
    const result = await this.connection.insert<DirectoryReports>(
      DirectoryReportsModel,
      body,
    );
    return result;
  }

  public async UpdateDirectory(directoryId: string, body: DirectoryReports) {
    const result = await this.connection.update<DirectoryReports>(
      DirectoryReportsModel,
      body,
      {
        _id: directoryId,
      },
    );
    return result;
  }

  public async GetDirectories() {
    const result = await this.connection.find<DirectoryReports>(
      DirectoryReportsModel,
    );
    return result;
  }

  public async GetDirectoriesByPath(name: string, path: string) {
    const result = await this.connection.find<DirectoryReports>(
      DirectoryReportsModel,
      {
        name,
        path,
      },
    );

    return result[0];
  }

  public async GetReportsByDirectory(directory: string) {
    const result = await this.connection.find<DBReport>(ReportModel, {
      directory: { $regex: directory, $options: "i" },
    });
    return result;
  }

  public async GetSubdirectoriesByPath(parentPath: string) {
    const result = await this.connection.find<DirectoryReports>(
      DirectoryReportsModel,
      {
        path: { $regex: `^${parentPath}/`, $options: "i" },
      },
    );
    return result;
  }

  public async InsertPendingExportReport(body: PendingExportReport) {
    const result = await this.connection.insert<PendingExportReport>(
      PendingExportReportModel,
      body,
    );
    return result;
  }

  public async GetOnePendingExportReport(reportId: string, owner?: string) {
    const pendingFilter: { reportId: string; owner?: string } = { reportId };
    if (owner) pendingFilter.owner = owner;

    const result = await this.connection.getOne<PendingExportReport>(
      PendingExportReportModel,
      pendingFilter,
    );
    return result;
  }

  public async UpdatePendingExportReport(
    reportId: string,
    body: PendingExportReport,
    owner?: string,
  ) {
    const pendingFilter: { reportId: string; owner?: string } = { reportId };
    if (owner) pendingFilter.owner = owner;

    const result = await this.connection.update<PendingExportReport>(
      PendingExportReportModel,
      body,
      pendingFilter,
    );
    return result;
  }

  public async DeletePendingExportReport(reportId: string, owner?: string) {
    const pendingFilter: { reportId: string; owner?: string } = { reportId };
    if (owner) pendingFilter.owner = owner;

    const result = await this.connection.delete<PendingExportReport>(
      PendingExportReportModel,
      pendingFilter,
    );
    return result;
  }
}

export default MainDal;
