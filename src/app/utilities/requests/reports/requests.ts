import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import { DBReport, ExportReport, ReportInt } from "@/app/models/Report";
import { ExecuteReport } from "@/app/models/executeReport";
import Miselanius from "@/app/utilities/Miselanius";

class ReportsReq {
  client = new Client();

  public async Insert(body: ReportInt): Promise<BaseResponse<null>> {
    const result = await this.client.Post<ReportInt, null>(
      `reports/maintenance`,
      body,
    );

    return result;
  }

  public async Update(
    reportId: string | undefined,
    body: ReportInt,
  ): Promise<BaseResponse<null>> {
    const result = await this.client.Put<ReportInt, null>(
      `reports/maintenance?reportId=${reportId}`,
      body,
    );

    return result;
  }

  public async GetOne(reportId: string): Promise<BaseResponse<DBReport>> {
    const result = await this.client.Get<DBReport>(
      `reports/findOne?reportId=${reportId}`,
    );

    return result;
  }

  public async GetAll(filter: string): Promise<BaseResponse<DBReport[]>> {
    const result = await this.client.Get<DBReport[]>("reports/");

    return result;
  }

  public async Execute(
    body: ExecuteReport,
    fileName: string,
  ): Promise<BaseResponse<null>> {
    const result = await this.client.Post<ExecuteReport, null>(
      `reports/execute`,
      body,
    );

    if (result && result.isSuccess && result.body) {
      const blob = new Miselanius().base64ToBlob(
        result.body,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ?? "reporte.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }

    return result;
  }

  public async Export(body: ExportReport): Promise<BaseResponse<ExportReport>> {
    const result = await this.client.Post<ExportReport, ExportReport>(
      `reports/export`,
      body,
    );

    return result;
  }

  public async Import(body: ExportReport): Promise<BaseResponse<null>> {
    const result = await this.client.Post<ExportReport, null>(
      `reports/import`,
      body,
    );

    return result;
  }
}

export default ReportsReq;
