/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExecuteReport,
  ExecuteReportFile,
  ExecuteReportResult,
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

class ReportsBll {
  private dal: ReportsDal;
  private log: Logs;

  constructor() {
    this.dal = new ReportsDal();
    this.log = new Logs();
  }

  public async ExecuteOne(
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
            let value = param.value.toString();
            if (value !== null && value !== "" && value !== undefined) {
              switch (param.type) {
                case "text":
                  value = `'${value}'`;
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
                        return `'${x}'`;
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
    debugger;
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
      if (value === null || value === undefined) return null;
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof Date
      ) {
        return value;
      }
      return JSON.stringify(value);
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
          sheet.getRow(currentRow).values = columns;
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
        sheet.getRow(currentRow).values = masterColumns;
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
          sheet.getRow(currentRow).values = detailColumns;
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
        for (const formula of element.formulas) {
          setFormula(
            groupedSheet,
            formula.column,
            formula.row,
            formula.formula,
          );
        }
      }
      autoFitColumns(groupedSheet);
    } else {
      for (const element of sheets) {
        const sheet = workbook.addWorksheet(element.sheetName);
        writeResultBlock(sheet, element, 1);
        for (const formula of element.formulas) {
          setFormula(sheet, formula.column, formula.row, formula.formula);
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
}

export default ReportsBll;
