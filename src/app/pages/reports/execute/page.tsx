"use client";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/sidebar";
import IntancesReq from "@/app/utilities/requests/instances/requests";
import PersonalInput from "../../components/input";
import PersonalButton from "../../components/button";
import RoleGuard from "../../components/RolGuard";
import Message from "../../components/popups";
import { ReportInt } from "@/app/models/Report";
import ReportsReq from "@/app/utilities/requests/reports/requests";
import {
  ExecuteReport,
  ParametersReport,
  QueryParams,
} from "@/app/models/executeReport";

const Maintenance = () => {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportInt>({
    name: "",
    querys: [],
    isActive: true,
  });
  const [executeReport, setExecuteReport] = useState<ExecuteReport>(
    new ExecuteReport(),
  );

  const client = new ReportsReq();
  const message = new Message();
  const reportId = searchParams.get("reportId") ?? "";

  useEffect(() => {}, [reportId]);

  useEffect(() => {
    client.GetOne(reportId).then((response) => {
      if (response.isSuccess && response.body) {
        const tmpReport: ReportInt = {
          name: "",
          querys: [],
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
          });
        });

        setReport(tmpReport);
        setExecuteReport((pre) => {
          pre.queryParams = [];
          tmpReport.querys.forEach((x) => {
            const queryParams = new QueryParams();
            queryParams.sheetName = x.sheetName;
            queryParams.parameters = x.parameters.map((y) => {
              const param = new ParametersReport();
              param.name = y.name;
              param.type = y.type;

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
    console.log(copy);
    setExecuteReport(copy);
  };

  const onExport = () => {
    const copy = Object.assign(new ExecuteReport(), executeReport);
    copy.id = reportId;

    client.Execute(copy, report.name);
  };

  return (
    <AppShell>
      <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Report</h1>
              <p>{report.name}</p>
            </div>
            <form>
              <div id="querys-container">
                {report.querys.map((q, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "1rem",
                      border: "1px solid #ddd",
                      padding: "0.75rem",
                      borderRadius: "8px",
                    }}
                  >
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
                            type={x.type}
                            key={x.name}
                            onChange={(e) => {
                              onSetParameter(e, x.name, x.type, q.sheetName);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rightButtonsContainer">
                <PersonalButton
                  text="Export"
                  type="button"
                  callback={onExport}
                />
              </div>
            </form>
          </div>
        </div>
      </RoleGuard>
    </AppShell>
  );
};

export default Maintenance;
