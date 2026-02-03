"use client";
import "./page.module.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/sidebar";
import IntancesReq from "@/app/utilities/requests/instances/requests";
import PersonalInput from "../../components/input";
import PersonalSelect, { SelectOptions } from "../../components/select";
import PersonalButton from "../../components/button";
import RoleGuard from "../../components/RolGuard";
import Message from "../../components/popups";
import { ExportReport, ReportInt } from "@/app/models/Report";
import BaseResponse from "@/app/models/baseResponse";
import ReportsReq from "@/app/utilities/requests/reports/requests";
import ActionGuard from "../../components/ActionGuard";
import SortTable from "../../components/table";
import { Instance } from "@/app/models/Instance";

const Maintenance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportInt>({
    name: "",
    querys: [],
    isActive: true,
  });
  const [options, setOptions] = useState<SelectOptions[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);

  const clientInstances = new IntancesReq();
  const client = new ReportsReq();
  const message = new Message();
  const reportId = searchParams.get("reportId") ?? "";

  useEffect(() => {
    clientInstances.GetAll("", true).then((response) => {
      const options: SelectOptions[] = [];
      if (response.isSuccess && response.body) {
        setInstances(response.body);
        response.body.forEach((x) => {
          options.push({
            text: x.name,
            value: x._id?.toString() as string,
          });

          setOptions(options);
        });
      }
    });

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
      }
    });
  }, []);

  const addQuery = () => {
    setReport((prev) => ({
      ...prev,
      querys: [
        ...prev.querys,
        { instance: "", query: "", sheetName: "", parameters: [] },
      ],
    }));
  };

  const onSubmit = async () => {
    let response = new BaseResponse();
    if (reportId) {
      response = await client.Update(reportId, report);
    } else {
      response = await client.Insert(report);
    }
    const icon = response.isSuccess ? "success" : "error";
    await message.Toast({
      icon,
      title: response.message,
    });
    if (response.isSuccess) {
      router.replace(`/pages/reports/index`);
    }
  };

  const onDelete = async () => {
    const tmpReport = { ...report };
    tmpReport.isActive = false;
    const response = await client.Update(reportId, tmpReport);

    await message.Toast({
      icon: response.isSuccess ? "success" : "error",
      title: response.message,
    });
    if (response.isSuccess) {
      router.replace(`/pages/reports/index`);
    }
  };

  const onAddParameter = async (queryIndex: number) => {
    const result = await message.ShowParametersUser({
      icon: "question",
      title: "Set new parameter",
    });

    if (!result) return;

    const paramName = result.paramName.replaceAll(" ", "_");

    setReport((prev) => {
      const newParam = {
        name: paramName,
        label: result.paramLabel,
        type: result.paramType,
      };

      return {
        ...prev,
        querys: prev.querys.map((item, i) =>
          i === queryIndex
            ? {
                ...item,
                query: `${item.query} @${paramName}`,
                parameters: [...(item.parameters ?? []), newParam],
              }
            : item,
        ),
      };
    });
  };

  const onEditParameter = async (name: string, queryIndex: number) => {
    const query = report.querys[queryIndex];
    const currentParam = query.parameters.find((p) => p.name === name);
    if (!currentParam) return;

    const result = await message.ShowParametersUser(
      {
        icon: "question",
        title: "Edit parameter",
      },
      {
        paramLabel: currentParam.label,
        paramName: currentParam.name,
        paramType: currentParam.type,
      },
    );

    if (!result) return;

    setReport((prev) => {
      return {
        ...prev,
        querys: prev.querys.map((item, i) =>
          i === queryIndex
            ? {
                ...item,
                query: item.query.replace(`@${name}`, `@${result?.paramName}`),
                parameters: item.parameters.map((p) =>
                  p.name === name
                    ? {
                        ...p,
                        name: result?.paramName,
                        label: result?.paramLabel,
                        type: result?.paramType,
                      }
                    : p,
                ),
              }
            : item,
        ),
      };
    });
  };

  const onDeleteParameter = (name: string, queryIndex: number) => {
    setReport((prev) => {
      const q = prev.querys[queryIndex];

      const newParameters = q.parameters.filter((p) => p.name !== name);

      return {
        ...prev,
        querys: prev.querys.map((item, i) =>
          i === queryIndex
            ? {
                ...item,
                query: item.query
                  .replaceAll(`@${name}`, "")
                  .replaceAll("  ", " "),
                parameters: newParameters,
              }
            : item,
        ),
      };
    });
  };

  const onExport = async () => {
    const isEncrypted: boolean = await message.ShowExportFile({
      icon: "question",
      title: "Export Report",
    });

    if (isEncrypted !== null && isEncrypted !== undefined) {
      let exportData: ExportReport = {
        report: report,
        instances: [],
        isEncrypted: isEncrypted,
      };

      report.querys.forEach((x) => {
        if (
          !(exportData.instances as Instance[]).some(
            (y) => y._id?.toString() === x.instance,
          )
        ) {
          (exportData.instances as Instance[]).push(
            instances?.find(
              (y) => y._id?.toString() === x.instance,
            ) as Instance,
          );
        }
      });

      if (isEncrypted) {
        exportData = (await client.Export(exportData)).body as ExportReport;
      }
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = report.name;
      a.click();

      URL.revokeObjectURL(url);
    }
  };

  return (
    <AppShell>
      <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Reports Maintenance</h1>
              <p>Create or update a data base report</p>
            </div>
            <form>
              <div style={{ display: "flex" }}>
                <PersonalInput
                  labelText="Report Name"
                  type="text"
                  isRequired={true}
                  value={report?.name}
                  onChange={(e) => setReport((r) => ({ ...r, name: e }))}
                />
                <div style={{ marginTop: "0.6rem" }}>
                  <PersonalButton
                    text="Add Query"
                    callback={addQuery}
                    isPrimary={true}
                  />
                </div>
              </div>
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
                    <PersonalSelect
                      labelText={`Instance ${index + 1}`}
                      options={options}
                      value={q.instance}
                      isRequered={true}
                      onChange={(value) => {
                        setReport((prev) => {
                          const copy = { ...prev };
                          copy.querys = [...copy.querys];
                          copy.querys[index] = {
                            ...copy.querys[index],
                            instance: value,
                          };
                          return copy;
                        });
                      }}
                    />
                    <PersonalInput
                      labelText={`Sheet Name ${index + 1}`}
                      type="text"
                      value={q.sheetName}
                      onChange={(value) => {
                        setReport((prev) => {
                          const copy = { ...prev };
                          copy.querys = [...copy.querys];
                          copy.querys[index] = {
                            ...copy.querys[index],
                            sheetName: value,
                          };
                          return copy;
                        });
                      }}
                    />
                    <PersonalInput
                      labelText={`Query ${index + 1}`}
                      type="textarea"
                      value={q.query}
                      onChange={(value) => {
                        setReport((prev) => {
                          const copy = { ...prev };
                          copy.querys = [...copy.querys];
                          copy.querys[index] = {
                            ...copy.querys[index],
                            query: value,
                          };
                          return copy;
                        });
                      }}
                    />
                    <SortTable
                      rows={report.querys[index].parameters}
                      columnsNames={
                        ["Name", "Label", "Type"] as unknown as null | undefined
                      }
                      buttons={
                        [
                          (row: string[]) => {
                            return (
                              <PersonalButton
                                text="Delete"
                                className="redButton"
                                isPrimary={true}
                                callback={() =>
                                  onDeleteParameter(row[0], index)
                                }
                              />
                            );
                          },
                          (row: string[]) => {
                            return (
                              <PersonalButton
                                text="Edit"
                                isPrimary={true}
                                callback={() => onEditParameter(row[0], index)}
                              />
                            );
                          },
                        ] as unknown as null | undefined
                      }
                    />
                    <div className="rightButtonsContainer">
                      <PersonalButton
                        text="Remove"
                        type="button"
                        className="redButton"
                        callback={() => {
                          setReport((prev) => ({
                            ...prev,
                            querys: prev.querys.filter((_, i) => i !== index),
                          }));
                        }}
                      />
                      <PersonalButton
                        text="Add Parameter"
                        type="button"
                        callback={() => {
                          onAddParameter(index);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rightButtonsContainer">
                {reportId && (
                  <ActionGuard allowed={["ADMIN"]}>
                    <PersonalButton
                      text="Delete"
                      type="button"
                      className="redButton"
                      callback={onDelete}
                    />
                  </ActionGuard>
                )}
                <PersonalButton
                  text="Save All"
                  type="button"
                  callback={onSubmit}
                />
                {reportId && (
                  <ActionGuard allowed={["ADMIN"]}>
                    <PersonalButton
                      text="Export"
                      type="button"
                      callback={onExport}
                    />
                  </ActionGuard>
                )}
              </div>
            </form>
          </div>
        </div>
      </RoleGuard>
    </AppShell>
  );
};

export default Maintenance;
