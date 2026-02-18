"use client";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/sidebar";
import PersonalInput from "../../components/input";
import PersonalButton from "../../components/button";
import RoleGuard from "../../components/RolGuard";
import Message from "../../components/popups";
import { FormulaInt, ReportInt } from "@/app/models/Report";
import ReportsReq from "@/app/utilities/requests/reports/requests";
import {
  ExecuteReport,
  ParametersReport,
  QueryParams,
} from "@/app/models/executeReport";
import GoBack from "../../components/goBack";

const Maintenance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportInt>({
    name: "",
    querys: [],
    directory: "",
    isActive: true,
  });
  const [executeReport, setExecuteReport] = useState<ExecuteReport>(
    new ExecuteReport(),
  );

  const client = new ReportsReq(router);
  const message = new Message();
  const reportId = searchParams.get("reportId") ?? "";

  useEffect(() => {}, [reportId]);

  useEffect(() => {
    client.GetOne(reportId).then((response) => {
      if (response.isSuccess && response.body) {
        const tmpReport: ReportInt = {
          name: "",
          querys: [],
          directory: "",
          isActive: false,
        };
        tmpReport._id = response.body._id?.toString();
        tmpReport.name = response.body.name;
        tmpReport.isActive = response.body.isActive;
        response.body.querys.forEach((x) => {
          tmpReport.querys.push({
            instance: x.instance?.toString() as string,
            query: x.query,
            sheetName: x.sheetName,
            parameters: x.parameters,
            subQuery: x.subQuery,
          });
        });

        setReport(tmpReport);
        setExecuteReport((pre) => {
          pre.queryParams = [];
          tmpReport.querys.forEach((x) => {
            const queryParams = new QueryParams();
            queryParams.sheetName = x.sheetName;
            queryParams.formulas = x.formulas as FormulaInt[];
            queryParams.parameters = x.parameters.map((y) => {
              const param = new ParametersReport();
              param.name = y.name;
              param.type = y.type;
              param.isRequired = y.isRequired;

              return param;
            });
            pre.queryParams.push(queryParams);
          });

          return pre;
        });
      }
    });
  }, []);

  const onSetParameter = (
    value: string | number,
    name: string,
    type: string,
    sheetName: string,
  ) => {
    if (type === "number") {
      value = parseFloat(value.toString());
    }

    const copy = Object.assign(new ExecuteReport(), executeReport);
    copy.queryParams = Object.assign(
      new Array<ParametersReport>(),
      copy.queryParams,
    );
    copy.queryParams.map((item) => {
      item = Object.assign(new QueryParams(), item);
    });

    const indexCurrent = copy.queryParams.findIndex(
      (x) => x.sheetName === sheetName,
    );

    if (indexCurrent > -1) {
      copy.queryParams[indexCurrent].parameters[
        copy.queryParams[indexCurrent].parameters.findIndex(
          (x) => x.name === name,
        )
      ].value = value;
    }

    setExecuteReport(copy);
  };

  const onExport = async () => {
    const copy = Object.assign(new ExecuteReport(), executeReport);
    copy.id = reportId;

    const result = await message.ShowExportReport({
      icon: "question",
      title: "Export Way",
    });

    if (result) {
      copy.singleSheet = result.oneSheet;
      copy.format = result.exportType as string;
      await client.Execute(copy, report.name);
    }
  };

  return (
    <AppShell>
      <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
        <div className={`container ${style.pageContainer}`}>
          <div className={`center-container ${style.pageCard}`}>
            <div className={`form-title ${style.formTitle}`}>
              <h1>Report</h1>
              <p className={style.reportName}>{report.name}</p>
              <span className={style.sheetCounter}>
                {report.querys.length} sheet
                {report.querys.length === 1 ? "" : "s"}
              </span>
            </div>
            <form className={style.formContent}>
              <div id="querys-container" className={style.querysContainer}>
                {report.querys.map((q, index) => (
                  <div key={index} className={style.queryCard}>
                    <h2
                      className={style.sheetName}
                      style={{
                        gridTemplateRows: `${Math.ceil(q.parameters.length / 5)}`,
                      }}
                    >
                      {q.sheetName}
                    </h2>
                    <div className={style.filtersContainer}>
                      {q.parameters.map((x) => {
                        return (
                          <PersonalInput
                            labelText={x.label}
                            type={x.type.includes("list") ? "text" : x.type}
                            key={x.name}
                            isRequired={x.isRequired}
                            placeholder={
                              x.type.includes("list") ? "value,value,value" : ""
                            }
                            onChange={(e) => {
                              onSetParameter(e, x.name, x.type, q.sheetName);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                {report.querys.length === 0 && (
                  <div className={style.emptyState}>
                    <h3>No parameters configured</h3>
                    <p>This report has no executable query parameters.</p>
                  </div>
                )}
              </div>
              <div className={`rightButtonsContainer ${style.actions}`}>
                <PersonalButton
                  text="Export"
                  type="button"
                  callback={onExport}
                />
                <GoBack url="/pages/reports/index" />
              </div>
            </form>
          </div>
        </div>
      </RoleGuard>
    </AppShell>
  );
};

export default Maintenance;
