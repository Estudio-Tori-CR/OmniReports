import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import { DBReport, ExportReport, ReportInt } from "@/app/models/Report";
import { ExecuteReport, ExecuteReportResult } from "@/app/models/executeReport";
import Miselanius from "@/app/utilities/Miselanius";
import { useRouter } from "next/navigation";
import { DirectoryReports } from "@/app/models/directory";

class ReportsReq {
  private client: Client;

  constructor(router: ReturnType<typeof useRouter>) {
    this.client = new Client(router);
  }

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

  public async GetAll(
    filter: string[] | string,
    userId: string,
  ): Promise<BaseResponse<DBReport[]>> {
    const result = await this.client.Get<DBReport[]>(
      "reports/?filter=" +
        encodeURIComponent(JSON.stringify(filter)) +
        "&userId=" +
        userId,
    );

    return result;
  }

  public async Execute(
    body: ExecuteReport,
    fileName: string,
  ): Promise<BaseResponse<ExecuteReportResult>> {
    const result = await this.client.Post<ExecuteReport, ExecuteReportResult>(
      `reports/execute`,
      body,
    );

    if (result && result.isSuccess && result.body?.files?.length) {
      const files = result.body.files;
      const defaultBaseName = (fileName ?? "reporte").trim() || "reporte";

      for (let index = 0; index < files.length; index++) {
        const currentFile = files[index];
        const blob = new Miselanius().base64ToBlob(
          currentFile.contentBase64,
          currentFile.mimeType,
        );

        const url = window.URL.createObjectURL(blob);
        const downloadName =
          body.format === "xlsx" && files.length === 1
            ? `${defaultBaseName}.xlsx`
            : currentFile.fileName || `${defaultBaseName}_${index + 1}.csv`;

        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 15_000);
      }
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

  public async InsertDirectory(
    body: DirectoryReports,
  ): Promise<BaseResponse<null>> {
    const result = await this.client.Post<DirectoryReports, null>(
      `reports/directory/maintenance`,
      body,
    );

    return result;
  }

  public async UpdateDirectory(
    newName: string,
    path: string,
    oldName: string,
  ): Promise<BaseResponse<null>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.client.Put<any, null>(
      `reports/directory/maintenance`,
      {
        newName,
        path,
        oldName,
      },
    );

    return result;
  }

  public async GetDirectories(): Promise<BaseResponse<DirectoryReports[]>> {
    const result =
      await this.client.Get<DirectoryReports[]>("reports/directory");

    return result;
  }
}

export default ReportsReq;

