/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecuteReport } from "@/app/models/executeReport";
import MainDal from "../dal/mainDal";
import ReportsDal from "../dal/reportsDal";
import Miselanius from "../../utilities/Miselanius";
import { QueryToExecute, ResultToExcel } from "@/app/models/Report";
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
  ): Promise<BaseResponse<string>> {
    const response = new BaseResponse<string>();
    const mainDal = new MainDal();
    const utilities = new Miselanius();

    try {
      const encript = new Encript();
      const report = await mainDal.GetReport(execute.id);
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
            !element.parameters.some(
              (x) =>
                x.value === null || x.value === "" || x.value === undefined,
            )
          ) {
            let queryToExecute = q.query;
            const instance = await mainDal.GetInstance(q.instance as string);

            for (const param of element.parameters) {
              let value = param.value.toString();

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
              }

              queryToExecute = queryToExecute.replaceAll(
                `@${param.name}`,
                value,
              );
            }

            querysToExecute.push({
              connectionString: new Encript().decrypt(
                instance?.connectionString ?? "",
              ),
              instanceType: instance?.type as string,
              query: queryToExecute,
              sheetName: element.sheetName,
            });
          }
        }
      }

      if (querysToExecute.length === 0) {
        response.isSuccess = false;
        response.message = "Please fill in the parameters";
        response.body = null as any;
        return response;
      }

      const results: ResultToExcel[] = [];

      try {
        for (const element of querysToExecute) {
          const result = await this.dal.Execute(
            element.connectionString,
            element.instanceType,
            element.query,
          );

          results.push({
            results: result ?? [],
            sheetName: element.sheetName,
          });
        }
      } catch (execErr) {
        this.log.log(`Error executing queries: ${execErr}`, "error");
        response.isSuccess = false;
        response.message = "Error executing queries";
        return response;
      }

      try {
        const bytes = await this.ExportToExcel(results);
        response.isSuccess = true;
        response.body = Buffer.from(bytes).toString("base64");
      } catch (excelErr) {
        this.log.log(`Error exporting to Excel: ${excelErr}`, "error");
        response.isSuccess = false;
        response.message = "Error exporting to Excel";
        throw excelErr;
      }
      return response;
    } catch (err) {
      response.isSuccess = false;
      response.message = "Unexpected error";
      this.log.log(`Unexpected error in ExecuteOne: ${err}`, "error");
      return response;
    }
  }

  private ExportToExcel = async (
    sheets: ResultToExcel[],
  ): Promise<Uint8Array> => {
    const workbook = new ExcelJS.Workbook();

    for (const element of sheets) {
      const sheet = workbook.addWorksheet(element.sheetName);
      const rows = element.results ?? [];

      const columns = rows.length
        ? Object.keys(((rows as any[])[0] ?? {}) as Record<string, any>)
        : [];

      sheet.columns = columns.map((key) => ({
        header: key,
        key,
        width: Math.max(12, key.length + 2),
      }));

      sheet.addRows(rows);
      if (rows.length) sheet.getRow(1).font = { bold: true };
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(arrayBuffer);
  };
}

export default ReportsBll;
