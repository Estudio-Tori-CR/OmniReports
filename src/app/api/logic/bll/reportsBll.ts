/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExecuteReport,
  ExecuteReportFile,
  ExecuteReportResult,
  ParametersReport,
  QueryParams,
} from "@/app/models/executeReport";
import MainDal from "../dal/mainDal";
import ReportsDal from "../dal/reportsDal";
import Miselanius from "../../utilities/Miselanius";
import {
  DbFormula,
  QueryToExecute,
  ResultSubQuery,
  ResultToExcel,
} from "@/app/models/Report";
import Encript from "../../utilities/Encript";
import ExcelJS from "exceljs";
import BaseResponse from "@/app/models/baseResponse";
import Logs from "../../utilities/Logs";
import { PendingExportReport } from "@/app/models/exportReports";
import Mail from "../../utilities/Mail";

class ReportsBll {
  private dal: ReportsDal;
  private log: Logs;

  constructor() {
    this.dal = new ReportsDal();
    this.log = new Logs();
  }

  private async ExecuteOne(
    execute: ExecuteReport,
  ): Promise<BaseResponse<ExecuteReportResult>> {
    const response = new BaseResponse<ExecuteReportResult>();
    const mainDal = new MainDal();
    const utilities = new Miselanius();
    const encript = new Encript();
    const report = await mainDal.GetReport(execute.id);

    try {
      report?.querys.forEach((q) => {
        q.query = encript.decrypt(q.query);
      });
      const querysToExecute: QueryToExecute[] = [];

      for (const q of report?.querys ?? []) {
        const params = execute.queryParams.filter(
          (p) => p.sheetName === q.sheetName,
        );

        for (const element of params) {
          if (
            element.parameters.some(
              (x) =>
                x.isRequired &&
                (x.value === null || x.value === "" || x.value === undefined),
            )
          ) {
            response.isSuccess = false;
            response.message =
              "Please complete all required parameters before running the report.";
            response.body = null as any;
            return response;
          }
          let queryToExecute = q.query;
          const instance = await mainDal.GetInstance(q.instance as string);

          for (const param of element.parameters) {
            const rawValue = param.value;
            let value =
              rawValue === null || rawValue === undefined
                ? ""
                : rawValue.toString();
            if (value !== "") {
              switch (param.type) {
                case "text":
                  value = `'${value.replaceAll("'", "''")}'`;
                  break;
                case "datetime-local":
                  switch (instance?.type) {
                    case "OracleDB":
                      value = utilities.toOracleDateTimeString(value);
                      break;
                    case "MySql":
                      value = utilities.toMySqlDateTimeString(value);
                      break;
                    case "SQLServer":
                      value = utilities.toSqlServerDateTimeString(value);
                      break;
                  }
                  break;
                case "date":
                  switch (instance?.type) {
                    case "OracleDB":
                      value = utilities.toOracleDateTimeString(value, false);
                      break;
                    case "MySql":
                      value = utilities.toMySqlDateTimeString(value, false);
                      break;
                    case "SQLServer":
                      value = utilities.toSqlServerDateTimeString(value, false);
                      break;
                  }
                  break;
                default:
                  if (param.type === "text-list") {
                    value = value
                      .split(",")
                      .map((x) => {
                        return `'${x.trim().replaceAll("'", "''")}'`;
                      })
                      .join(",");
                  }
                  break;
              }
            } else {
              value = "NULL";
            }

            queryToExecute = queryToExecute.replaceAll(`@${param.name}`, value);
          }

          querysToExecute.push({
            title: q.title ?? "",
            connectionString: new Encript().decrypt(
              instance?.connectionString ?? "",
            ),
            instanceType: instance?.type as string,
            query: queryToExecute,
            sheetName: element.sheetName,
            subQuery: q.subQuery,
            formulas: q.formulas as DbFormula[],
          });
        }
      }

      const results: ResultToExcel[] = [];

      try {
        const toSqlLiteral = (value: unknown): string => {
          if (value === null || value === undefined) return "NULL";
          if (typeof value === "number" || typeof value === "bigint") {
            return value.toString();
          }
          if (typeof value === "boolean") return value ? "1" : "0";
          return `'${String(value).replaceAll("'", "''")}'`;
        };

        for (const element of querysToExecute) {
          const result = await this.dal.Execute(
            element.connectionString,
            element.instanceType,
            element.query,
          );
          const mainRows = (Array.isArray(result) ? result : []) as Record<
            string,
            unknown
          >[];

          if (element.subQuery?.query) {
            const resultWithSubQuery: ResultSubQuery[] = [];
            const innerByName = element.subQuery.innerBy?.trim();

            for (const row of mainRows) {
              let subQueryRows: Record<string, unknown>[] = [];

              if (innerByName && row[innerByName] !== undefined) {
                const valueToReplace = toSqlLiteral(row[innerByName]);
                const placeholder = `@${innerByName}`;
                const subQueryText = element.subQuery.query.includes(
                  placeholder,
                )
                  ? element.subQuery.query.replaceAll(
                      placeholder,
                      valueToReplace,
                    )
                  : element.subQuery.query.replaceAll(
                      innerByName,
                      valueToReplace,
                    );

                const subQueryResult = await this.dal.Execute(
                  element.connectionString,
                  element.instanceType,
                  subQueryText,
                );
                subQueryRows = (
                  Array.isArray(subQueryResult) ? subQueryResult : []
                ) as Record<string, unknown>[];
              }

              resultWithSubQuery.push({
                result: row,
                subQuery: subQueryRows,
              });
            }

            results.push({
              title: element.title,
              results: resultWithSubQuery,
              sheetName: element.sheetName,
              formulas: element.formulas,
            });
          } else {
            results.push({
              title: element.title,
              results: mainRows,
              sheetName: element.sheetName,
              formulas: element.formulas,
            });
          }
        }
      } catch (execErr) {
        this.log.log(`Error executing queries: ${execErr}`, "error");
        response.isSuccess = false;
        response.message =
          "Failed to run one or more report queries. Please review the parameters and data source settings.";
        return response;
      }

      try {
        const files = await this.ExportToExcel(
          results,
          execute.singleSheet,
          execute.format,
        );
        response.isSuccess = true;
        response.message = "Report executed successfully.";
        response.body = { files };
      } catch (excelErr) {
        this.log.log(`Error exporting to Excel: ${excelErr}`, "error");
        response.isSuccess = false;
        response.message =
          "The report ran successfully, but exporting the file failed.";
        throw excelErr;
      }
      return response;
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while executing the report.";
      this.log.log(
        `Unexpected error in ExecuteOne: ${err}, report: ${report?.name}, parameters: ${JSON.stringify(execute.queryParams)}`,
        "error",
      );
      return response;
    }
  }

  private ExportToExcel = async (
    sheets: ResultToExcel[],
    singleSheet = false,
    exportType = "xlsx",
  ): Promise<ExecuteReportFile[]> => {
    const isSubQueryRow = (row: unknown): row is ResultSubQuery => {
      return (
        !!row && typeof row === "object" && "result" in row && "subQuery" in row
      );
    };

    const setFormula = (
      sheet: ExcelJS.Worksheet,
      colum: string,
      row: string,
      value: string,
    ) => {
      sheet.getCell(`${colum}${row}`).value = {
        formula: value,
      };
    };

    const toCellValue = (
      value: unknown,
    ): string | number | boolean | Date | null => {
      const sanitizeSpreadsheetText = (text: string) => {
        if (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) {
          return `'${text}`;
        }
        return text;
      };

      if (value === null || value === undefined) return null;
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof Date
      ) {
        if (typeof value === "string") {
          return sanitizeSpreadsheetText(value);
        }
        return value;
      }
      return sanitizeSpreadsheetText(JSON.stringify(value));
    };

    const autoFitColumns = (sheet: ExcelJS.Worksheet) => {
      const maxCol = sheet.columnCount;
      for (let col = 1; col <= maxCol; col++) {
        let width = 10;
        sheet.eachRow({ includeEmpty: false }, (row) => {
          const value = row.getCell(col).value;
          const text =
            value === null || value === undefined ? "" : String(value);
          width = Math.max(width, text.length + 2);
        });
        sheet.getColumn(col).width = Math.min(60, width);
      }
    };

    const writeTitleRow = (
      sheet: ExcelJS.Worksheet,
      title: string | undefined,
      totalColumns: number,
      rowNumber: number,
    ): number => {
      const titleText = title?.trim() ?? "";
      if (!titleText) return rowNumber;

      const mergeTo = Math.max(1, totalColumns);
      sheet.getCell(rowNumber, 1).value = titleText;
      sheet.getCell(rowNumber, 1).font = { bold: true, size: 14 };
      sheet.getCell(rowNumber, 1).alignment = { horizontal: "center" };
      if (mergeTo > 1) {
        sheet.mergeCells(rowNumber, 1, rowNumber, mergeTo);
      }
      return rowNumber + 1;
    };

    const writeResultBlock = (
      sheet: ExcelJS.Worksheet,
      element: ResultToExcel,
      startRow: number,
    ): number => {
      const rows = element.results ?? [];
      let currentRow = startRow;

      if (!rows.length) return currentRow;

      const firstRow = rows[0];
      if (!isSubQueryRow(firstRow)) {
        const plainRows = rows as Record<string, unknown>[];
        const columns = Object.keys(
          (plainRows[0] ?? {}) as Record<string, unknown>,
        );

        currentRow = writeTitleRow(
          sheet,
          element.title,
          columns.length,
          currentRow,
        );
        if (columns.length) {
          sheet.getRow(currentRow).values = columns.map((column) =>
            toCellValue(column),
          );
          sheet.getRow(currentRow).font = { bold: true };
          currentRow++;
        }

        for (const plainRow of plainRows) {
          sheet.getRow(currentRow).values = columns.map((column) =>
            toCellValue(plainRow[column]),
          );
          currentRow++;
        }

        return currentRow + 1;
      }

      const rowsWithSubQuery = rows as ResultSubQuery[];
      const masterColumns = Object.keys(rowsWithSubQuery[0]?.result ?? {});
      currentRow = writeTitleRow(
        sheet,
        element.title,
        masterColumns.length,
        currentRow,
      );

      if (masterColumns.length) {
        sheet.getRow(currentRow).values = masterColumns.map((column) =>
          toCellValue(column),
        );
        sheet.getRow(currentRow).font = { bold: true };
        currentRow++;
      }

      for (const item of rowsWithSubQuery) {
        const masterValues = masterColumns.map((column) =>
          toCellValue(item.result?.[column]),
        );
        sheet.getRow(currentRow).values = masterValues;
        currentRow++;

        const detailRows = item.subQuery ?? [];
        if (detailRows.length) {
          sheet.getCell(currentRow, 1).value = "Detail";
          sheet.getRow(currentRow).font = { italic: true };
          currentRow++;

          const detailColumns = Object.keys(detailRows[0] ?? {});
          sheet.getRow(currentRow).values = detailColumns.map((column) =>
            toCellValue(column),
          );
          sheet.getRow(currentRow).font = { bold: true };
          currentRow++;

          for (const detailRow of detailRows) {
            sheet.getRow(currentRow).values = detailColumns.map((column) =>
              toCellValue(detailRow[column]),
            );
            currentRow++;
          }
        }

        currentRow++;
      }

      return currentRow + 1;
    };

    const toSafeFileName = (name: string, fallback: string): string => {
      const clean = name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, " ");
      return clean || fallback;
    };

    if (exportType === "csv") {
      const files: ExecuteReportFile[] = [];
      const usedNames = new Map<string, number>();

      for (let i = 0; i < sheets.length; i++) {
        const element = sheets[i];
        const workbook = new ExcelJS.Workbook();
        const sheetName = element.sheetName?.trim() || `sheet_${i + 1}`;
        const sheet = workbook.addWorksheet(sheetName);
        writeResultBlock(sheet, element, 1);
        autoFitColumns(sheet);

        const arrayBuffer = await workbook.csv.writeBuffer();
        const csvBytes = new Uint8Array(arrayBuffer);
        const csvWithBom = Buffer.concat([
          Buffer.from([0xef, 0xbb, 0xbf]),
          Buffer.from(csvBytes),
        ]);
        const baseName = toSafeFileName(sheetName, `sheet_${i + 1}`);
        const count = (usedNames.get(baseName) ?? 0) + 1;
        usedNames.set(baseName, count);
        const uniqueName = count > 1 ? `${baseName}_${count}` : baseName;

        files.push({
          fileName: `${uniqueName}.csv`,
          mimeType: "text/csv;charset=utf-8",
          contentBase64: csvWithBom.toString("base64"),
        });
      }

      return files;
    }

    const workbook = new ExcelJS.Workbook();
    if (singleSheet) {
      const groupedSheet = workbook.addWorksheet("Report");
      let currentRow = 1;
      for (const element of sheets) {
        currentRow = writeResultBlock(groupedSheet, element, currentRow);
        if (element.formulas) {
          for (const formula of element.formulas) {
            setFormula(
              groupedSheet,
              formula.column,
              formula.row,
              formula.formula,
            );
          }
        }
      }
      autoFitColumns(groupedSheet);
    } else {
      for (const element of sheets) {
        const sheet = workbook.addWorksheet(element.sheetName);
        writeResultBlock(sheet, element, 1);
        if (element.formulas) {
          for (const formula of element.formulas) {
            setFormula(sheet, formula.column, formula.row, formula.formula);
          }
        }
        autoFitColumns(sheet);
      }
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return [
      {
        fileName: "report.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        contentBase64: Buffer.from(new Uint8Array(arrayBuffer)).toString(
          "base64",
        ),
      },
    ];
  };

  private async SaveExport(
    reportId: string,
    owner: string,
    status: string,
    message: string = "",
    files: ExecuteReportFile[] = [],
  ) {
    const mainDal = new MainDal();
    const exist =
      (await mainDal.GetOnePendingExportReport(reportId, owner)) ?? false;

    if (exist) {
      await mainDal.UpdatePendingExportReport(
        reportId,
        {
          owner,
          files: files.map((x) => {
            return {
              file: x.contentBase64,
              fileName: x.fileName,
              mimeType: x.mimeType,
            };
          }),
          reportId: reportId,
          status: status,
          message: message,
        },
        owner,
      );
    } else {
      await mainDal.InsertPendingExportReport({
        owner,
        files: files.map((x) => {
          return {
            file: x.contentBase64,
            fileName: x.fileName,
            mimeType: x.mimeType,
          };
        }),
        reportId: reportId,
        status: status,
        message: message,
      });
    }
  }

  public async ExecuteAndSendScheduledReport(reportId: string) {
    const response = new BaseResponse<null>();
    const normalizedReportId = (reportId ?? "").trim();
    if (!normalizedReportId) {
      response.isSuccess = false;
      response.message = "Invalid report id.";
      return response;
    }

    const mainDal = new MainDal();
    const report = await mainDal.GetReport(normalizedReportId);

    if (!report || !report.isActive) {
      response.isSuccess = false;
      response.message = "Report not found or inactive.";
      return response;
    }

    const toRecipients = (report.deliverySettings?.emailTo ?? "").trim();
    const ccRecipients = (report.deliverySettings?.emailCc ?? "").trim();
    const bccRecipients = (report.deliverySettings?.emailBcc ?? "").trim();

    let to = toRecipients;
    let cc = ccRecipients;
    let bcc = bccRecipients;

    if (!to && cc) {
      to = cc;
      cc = "";
    } else if (!to && bcc) {
      to = bcc;
      bcc = "";
    }

    if (!to) {
      response.isSuccess = false;
      response.message = "No recipients configured for scheduled delivery.";
      return response;
    }

    const executeBody = new ExecuteReport();
    executeBody.id = normalizedReportId;
    executeBody.singleSheet = false;
    executeBody.format = "xlsx";
    executeBody.queryParams = (report.querys ?? []).map((query) => {
      const item = new QueryParams();
      item.sheetName = query.sheetName ?? "";
      item.formulas = query.formulas ?? [];
      item.parameters = (query.parameters ?? []).map((parameter) => {
        const oneParameter = new ParametersReport();
        oneParameter.type = parameter.type ?? "";
        oneParameter.name = parameter.name ?? "";
        oneParameter.value = "";
        oneParameter.isRequired = parameter.isRequired === true;
        return oneParameter;
      });
      return item;
    });

    const execution = await this.ExecuteOne(executeBody);
    if (!execution.isSuccess || !execution.body?.files?.length) {
      response.isSuccess = false;
      response.message =
        execution.message || "Failed to execute the scheduled report.";
      return response;
    }

    const escapeHtml = (value: string): string =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const now = new Date();
    const filesListHtml = execution.body.files
      .map((file) => `- ${escapeHtml(file.fileName)}`)
      .join("<br />");

    await new Mail().SendMail({
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: `Scheduled report - ${report.name}`,
      text: `Your scheduled report "${report.name}" has been generated successfully. Files attached: ${execution.body.files
        .map((file) => file.fileName)
        .join(", ")}`,
      templateName: "scheduled_report",
      templateData: {
        reportName: report.name ?? "Report",
        DATE: now.toLocaleDateString(),
        TIME: now.toLocaleTimeString(),
        FILES_COUNT: execution.body.files.length.toString(),
        FILES_LIST: filesListHtml || "- report.xlsx",
        URL_LOGIN: process.env.URL_LOGIN ?? "",
        LOGO_URL: process.env.LOGO_URL ?? "",
        EMAIL_SUPPORT: process.env.EMAIL_SUPPORT ?? "",
      },
      attachments: execution.body.files.map((file) => ({
        filename: file.fileName,
        content: file.contentBase64,
        contentType: file.mimeType,
        encoding: "base64",
      })),
    });

    response.isSuccess = true;
    response.message = "Report exported and sent by email successfully.";
    return response;
  }

  public async ProcessExport(body: ExecuteReport, reportId: string, owner: string) {
    await this.SaveExport(reportId, owner, "I");
    setImmediate(async () => {
      const response = await this.ExecuteOne(body);

      await this.SaveExport(
        reportId,
        owner,
        response.isSuccess ? "F" : "E",
        response.message,
        response.body?.files,
      );
    });
  }

  public async DownloadExport(reportId: string, owner: string) {
    const response = new BaseResponse<PendingExportReport>();
    if (!reportId || !owner) {
      response.isSuccess = false;
      response.message = "Invalid export request.";
      return response;
    }

    const mainDal = new MainDal();
    const entity = await mainDal.GetOnePendingExportReport(reportId, owner);

    response.body = entity;
    response.isSuccess = entity?.status != "E";
    response.message = entity?.message as string;

    if (entity?.status != "I") {
      await mainDal.DeletePendingExportReport(reportId, owner);
    }

    return response;
  }
}

export default ReportsBll;
