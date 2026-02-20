import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import { DBReport, ExportReport, ReportInt } from "@/app/models/Report";
import { ExecuteReport, ExecuteReportResult } from "@/app/models/executeReport";
import Miselanius from "@/app/utilities/Miselanius";
import { PendingExportReport } from "@/app/models/exportReports";
import { useRouter } from "next/navigation";
import { DirectoryReports } from "@/app/models/directory";
import Loader from "@/app/pages/components/loading";

class ReportsReq {
  private client: Client;
  private static readonly EXPORT_POLLING_INTERVAL_MS = 1500;

  constructor(router: ReturnType<typeof useRouter>) {
    this.client = new Client(router);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private downloadFiles(
    files: PendingExportReport["files"],
    fileName: string,
    format: string,
  ) {
    const defaultBaseName = (fileName ?? "reporte").trim() || "reporte";

    for (let index = 0; index < files.length; index++) {
      const currentFile = files[index];
      const blob = new Miselanius().base64ToBlob(
        currentFile.file,
        currentFile.mimeType,
      );

      const url = window.URL.createObjectURL(blob);
      const downloadName =
        format === "xlsx" && files.length === 1
          ? `${defaultBaseName}.xlsx`
          : currentFile.fileName || `${defaultBaseName}_${index + 1}.csv`;

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 15_000);
    }
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

  public async GetAll(): Promise<BaseResponse<DBReport[]>> {
    const result = await this.client.Get<DBReport[]>("reports/");

    return result;
  }

  public async Execute(
    body: ExecuteReport,
    fileName: string,
  ): Promise<BaseResponse<ExecuteReportResult>> {
    const response = new BaseResponse<ExecuteReportResult>();
    try {
      Loader().show();

      const start = await this.client.Post<ExecuteReport, string>(
        `reports/execute`,
        body,
        false,
        false,
      );

      if (!start.isSuccess || !start.body) {
        response.isSuccess = false;
        response.message =
          start.message || "Failed to start report export. Please try again.";
        return response;
      }

      while (true) {
        const result = await this.client.Get<PendingExportReport>(
          `reports/execute?reportId=${start.body}`,
          false,
          false,
        );

        if (!result.isSuccess) {
          response.isSuccess = false;
          response.message =
            result.message || "Failed while generating the exported file.";
          return response;
        }

        if (
          result.body?.status === "F" &&
          (result.body.files?.length ?? 0) > 0
        ) {
          this.downloadFiles(result.body.files, fileName, body.format);

          response.isSuccess = true;
          response.message = result.message || "Report exported successfully.";
          response.body = {
            files: result.body.files.map((item) => ({
              fileName: item.fileName,
              mimeType: item.mimeType,
              contentBase64: item.file,
            })),
          };
          return response;
        }

        await this.sleep(ReportsReq.EXPORT_POLLING_INTERVAL_MS);
      }
    } finally {
      Loader().hidde();
    }
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
