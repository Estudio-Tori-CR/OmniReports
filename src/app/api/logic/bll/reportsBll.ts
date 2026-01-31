/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecuteReport } from "@/app/models/executeReport";
import MainDal from "../dal/mainDal";
import ReportsDal from "../dal/reportsDal";
import Miselanius from "../../utilities/Miselanius";
import { QueryToExecute, ResultToExcel } from "@/app/models/Report";
import Encript from "../../utilities/Encript";
import ExcelJS from "exceljs";
import BaseResponse from "@/app/models/baseResponse";

class ReportsBll {
  private dal: ReportsDal;

  constructor() {
    this.dal = new ReportsDal();
  }

  public async ExecuteOne(
    execute: ExecuteReport,
  ): Promise<BaseResponse<string>> {
    const response = new BaseResponse<string>();
    const mainDal = new MainDal();
    const utilities = new Miselanius();

    try {
      const report = await mainDal.GetReport(execute.id);

      const querysToExecute: QueryToExecute[] = [];

      for (const q of report.querys) {
        const params = execute.queryParams.filter(
          (p) => p.sheetName === q.sheetName,
        );

        for (const element of params) {
          let queryToExecute = q.query;
          const instance = await mainDal.GetInstance(q.instance.toString());

          for (const param of element.parameters) {
            let value = param.value.toString();

            switch (param.type) {
              case "text":
                value = `'${value}'`;
                break;

              case "datetime-local":
              case "date":
                switch (instance.type) {
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
            }

            queryToExecute = queryToExecute.replaceAll(`@${param.name}`, value);
          }

          querysToExecute.push({
            connectionString: new Encript().decrypt(instance.connectionString),
            instanceType: instance.type,
            query: queryToExecute,
            sheetName: element.sheetName,
          });
        }
      }

      if (querysToExecute.length === 0) {
        response.isSuccess = false;
        response.message = "Error";
        response.body = null as any;
        return response;
      }

      const results: ResultToExcel[] = [];

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

      const bytes = await this.ExportToExcel(results);

      response.isSuccess = true;
      response.body = Buffer.from(bytes).toString("base64");
      return response;
    } catch (err) {
      response.isSuccess = false;
      response.message =
        err instanceof Error ? err.message : "Unexpected error";
      response.body = null as any;
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
      
      const columns = rows.length ? Object.keys(rows[0]) : [];

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
