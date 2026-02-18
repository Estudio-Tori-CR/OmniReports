"use client";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
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
import UsersReq from "@/app/utilities/requests/users/requests";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import PersonalMultiSelect, {
  MultiSelectOption,
} from "../../components/multiSelect";
import GoBack from "../../components/goBack";

const Maintenance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, _id } = useAppSelector((s) => s.user);
  const [report, setReport] = useState<ReportInt>({
    name: "",
    querys: [],
    directory: "",
    isActive: true,
  });
  const [options, setOptions] = useState<SelectOptions[]>([]);
  const [optionsDirectories, setOptionsDirectorie] = useState<SelectOptions[]>(
    [],
  );
  const [optionsUser, setOptionsUser] = useState<MultiSelectOption[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [usersForReport, setUsersForReport] = useState<string[]>([]);
  const [advancedSettingsByIndex, setAdvancedSettingsByIndex] = useState<
    Record<number, boolean>
  >({});

  const clientInstances = new IntancesReq(router);
  const clientUsers = new UsersReq(router);
  const client = new ReportsReq(router);
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
          directory: "",
          isActive: false,
        };
        tmpReport._id = response.body._id?.toString();
        tmpReport.name = response.body.name;
        tmpReport.isActive = response.body.isActive;
        tmpReport.directory = response.body.directory;
        response.body.querys.forEach((x) => {
          tmpReport.querys.push({
            title: x.title ?? "",
            instance: x.instance?.toString() as string,
            query: x.query,
            sheetName: x.sheetName,
            parameters: x.parameters,
            subQuery: x.subQuery ?? { query: "", innerBy: "" },
            formulas: x.formulas ?? [],
          });
        });

        setReport(tmpReport);
      } else {
        setReport({
          name: "",
          querys: [],
          directory: "",
          isActive: true,
        });
      }
    });

    client.GetDirectories().then((response) => {
      const options: SelectOptions[] = [];

      if (response.isSuccess && response.body) {
        for (let i = 0; i < response.body.length; i++) {
          const element = response.body[i];
          options.push({
            text: `${element.name} - ${element.path}`,
            value: element.path,
          });
        }
      }

      setOptionsDirectorie(options);
    });
  }, []);

  useEffect(() => {
    if (role.includes("ADMIN")) {
      clientUsers.GetAll("").then((response) => {
        if (response.isSuccess && response.body) {
          const optionsTmp = [...optionsUser];
          response.body.forEach((x) => {
            optionsTmp.push({
              text: `${x.firstName} ${x.lastName}`,
              value: x._id?.toString() as string,
            });

            setUsersForReport([]);
            response.body?.forEach((user) => {
              if (user.reports.includes(reportId)) {
                setUsersForReport((prev) => [
                  ...prev,
                  user._id?.toString() as string,
                ]);
              }
            });
          });
          setOptionsUser(optionsTmp);
        }
      });
    }
  }, []);

  const addQuery = () => {
    setReport((prev) => ({
      ...prev,
      querys: [
        ...prev.querys,
        {
          title: "",
          instance: "",
          query: "",
          sheetName: "",
          parameters: [],
          subQuery: { query: "", innerBy: "" },
          formulas: [],
        },
      ],
    }));
  };

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    let response = new BaseResponse();
    if (reportId) {
      response = await client.Update(reportId, report);
    } else {
      response = await client.Insert(report);
    }

    if (response.isSuccess) {
      const usersTmp = [...usersForReport];
      if (!usersTmp.includes(_id)) {
        usersTmp.push(_id);
      }

      await clientUsers.AddReport(
        //body have the id of the new report
        reportId !== "" && reportId !== undefined
          ? reportId
          : (response.body as string),
        usersTmp,
      );
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
        isRequired: result.isRequired,
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
        isRequired: currentParam.isRequired,
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
                        isRequired: result.isRequired,
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

  const onToggleAdvancedSettings = (queryIndex: number) => {
    setAdvancedSettingsByIndex((prev) => ({
      ...prev,
      [queryIndex]: !prev[queryIndex],
    }));
  };

  const onRemoveQuery = (queryIndex: number) => {
    setReport((prev) => ({
      ...prev,
      querys: prev.querys.filter((_, i) => i !== queryIndex),
    }));

    setAdvancedSettingsByIndex((prev) => {
      const next: Record<number, boolean> = {};
      for (const [k, value] of Object.entries(prev)) {
        const index = Number(k);
        if (Number.isNaN(index) || index === queryIndex) continue;
        next[index > queryIndex ? index - 1 : index] = value;
      }
      return next;
    });
  };

  const onAddFormula = (queryIndex: number) => {
    setReport((prev) => ({
      ...prev,
      querys: prev.querys.map((item, i) =>
        i === queryIndex
          ? {
              ...item,
              formulas: [
                ...(item.formulas ?? []),
                { column: "", row: "", formula: "" },
              ],
            }
          : item,
      ),
    }));
  };

  const onChangeFormula = (
    queryIndex: number,
    formulaIndex: number,
    field: "column" | "row" | "formula",
    value: string,
  ) => {
    setReport((prev) => ({
      ...prev,
      querys: prev.querys.map((item, i) =>
        i === queryIndex
          ? {
              ...item,
              formulas: (item.formulas ?? []).map((formula, idx) =>
                idx === formulaIndex ? { ...formula, [field]: value } : formula,
              ),
            }
          : item,
      ),
    }));
  };

  const onRemoveFormula = (queryIndex: number, formulaIndex: number) => {
    setReport((prev) => ({
      ...prev,
      querys: prev.querys.map((item, i) =>
        i === queryIndex
          ? {
              ...item,
              formulas: (item.formulas ?? []).filter(
                (_, idx) => idx !== formulaIndex,
              ),
            }
          : item,
      ),
    }));
  };

  return (
    <AppShell>
      <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
        <div className={`container ${styles.maintenanceContainer}`}>
          <div className={`center-container ${styles.maintenanceCard}`}>
            <div className={`form-title ${styles.formTitle}`}>
              <h1>Reports Maintenance</h1>
              <p>Create or update a data base report</p>
              <span className={styles.queryCounter}>
                {report.querys.length} quer{report.querys.length === 1 ? "y" : "ies"}
              </span>
            </div>
            <form onSubmit={onSubmit} className={styles.maintenanceForm}>
              <div className={styles.topRow}>
                <div className={styles.topMainInput}>
                  <PersonalInput
                    labelText="Report Name"
                    type="text"
                    isRequired={true}
                    value={report?.name}
                    onChange={(e) => setReport((r) => ({ ...r, name: e }))}
                  />
                </div>
                <div className={styles.topAction}>
                  <PersonalButton
                    text="Add Query"
                    callback={addQuery}
                    isPrimary={true}
                    className={styles.compactButton}
                  />
                </div>
              </div>
              <div className={styles.metaBlock}>
                <PersonalSelect
                  labelText="Directory"
                  options={optionsDirectories}
                  isRequered={false}
                  value={report?.directory}
                  onChange={(e) => setReport((r) => ({ ...r, directory: e }))}
                />

                <ActionGuard allowed={["ADMIN"]}>
                  <PersonalMultiSelect
                    options={optionsUser}
                    labelText="Users"
                    values={usersForReport}
                    onChange={(value) => setUsersForReport(value)}
                  />
                </ActionGuard>
              </div>
              <div id="querys-container" className={styles.querysContainer}>
                {report.querys.length === 0 ? (
                  <div className={styles.emptyState}>
                    <h3>No queries yet</h3>
                    <p>
                      Add your first query to start building the report data
                      source.
                    </p>
                  </div>
                ) : (
                  report.querys.map((q, index) => (
                    <div key={index} className={styles.queryCard}>
                      <div className={styles.queryHeader}>
                        <h3>Query {index + 1}</h3>
                        <span className={styles.queryBadge}>#{index + 1}</span>
                      </div>
                      <div className={styles.queryGrid}>
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
                          isRequired={true}
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
                      </div>
                      <PersonalInput
                        labelText={`Title ${index + 1}`}
                        type="text"
                        value={q.title ?? ""}
                        isRequired={false}
                        onChange={(value) => {
                          setReport((prev) => {
                            const copy = { ...prev };
                            copy.querys = [...copy.querys];
                            copy.querys[index] = {
                              ...copy.querys[index],
                              title: value,
                            };
                            return copy;
                          });
                        }}
                      />
                      <PersonalInput
                        labelText={`Query ${index + 1}`}
                        type="textarea"
                        value={q.query}
                        isRequired={true}
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
                      <div className={styles.tableContainer}>
                        <SortTable
                          rows={report.querys[index].parameters.map((x) => {
                            return {
                              name: x.name,
                              label: x.label,
                              type: x.type,
                              isRequired: x.isRequired ? "Yes" : "No",
                            };
                          })}
                          columnsNames={
                            [
                              "Name",
                              "Label",
                              "Type",
                              "Is Required",
                            ] as unknown as null | undefined
                          }
                          buttons={
                            [
                              (row: string[]) => {
                                return (
                                  <PersonalButton
                                    text="Delete"
                                    className={`redButton ${styles.compactButton}`}
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
                                    className={styles.compactButton}
                                    isPrimary={true}
                                    callback={() =>
                                      onEditParameter(row[0], index)
                                    }
                                  />
                                );
                              },
                            ] as unknown as null | undefined
                          }
                        />
                      </div>
                      <div
                        className={`rightButtonsContainer ${styles.queryActions}`}
                      >
                        <PersonalButton
                          text="Add Parameter"
                          type="button"
                          className={styles.compactButton}
                          callback={() => {
                            onAddParameter(index);
                          }}
                        />
                        <PersonalButton
                          text="Remove"
                          type="button"
                          className={`redButton ${styles.compactButton}`}
                          callback={() => {
                            onRemoveQuery(index);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.advancedSettingsToggle}
                        onClick={() => {
                          onToggleAdvancedSettings(index);
                        }}
                      >
                        {advancedSettingsByIndex[index]
                          ? "Hide advanced settings"
                          : "Show advanced settings"}
                      </button>
                      <div
                        className={`${styles.subQueryContainer} ${
                          advancedSettingsByIndex[index]
                            ? styles.subQueryContainerOpen
                            : ""
                        }`}
                      >
                        <h4>Sub Query</h4>
                        <PersonalInput
                          type="text"
                          labelText="Inner By"
                          value={q.subQuery?.innerBy ?? ""}
                          onChange={(value) => {
                            setReport((prev) => {
                              const copy = { ...prev };
                              copy.querys = [...copy.querys];
                              copy.querys[index] = {
                                ...copy.querys[index],
                                subQuery: {
                                  ...(copy.querys[index].subQuery ?? {
                                    query: "",
                                    innerBy: "",
                                  }),
                                  innerBy: value,
                                  query: value ? `@${value}` : "",
                                },
                              };
                              return copy;
                            });
                          }}
                        />
                        <PersonalInput
                          type="textarea"
                          labelText="Sub Query"
                          value={q.subQuery?.query ?? ""}
                          onChange={(value) => {
                            setReport((prev) => {
                              const copy = { ...prev };
                              copy.querys = [...copy.querys];
                              copy.querys[index] = {
                                ...copy.querys[index],
                                subQuery: {
                                  ...(copy.querys[index].subQuery ?? {
                                    query: "",
                                    innerBy: "",
                                  }),
                                  query: value,
                                },
                              };
                              return copy;
                            });
                          }}
                        />
                        <div
                          className={`rightButtonsContainer ${styles.queryActions}`}
                        >
                          <PersonalButton
                            text="Add Formula"
                            type="button"
                            className={styles.compactButton}
                            callback={() => onAddFormula(index)}
                          />
                        </div>
                        {(q.formulas ?? []).map((formula, formulaIndex) => (
                          <div
                            key={`formula-${index}-${formulaIndex}`}
                            className={styles.formulaCard}
                          >
                            <div className={styles.formulaGrid}>
                              <PersonalInput
                                type="text"
                                labelText="Column"
                                value={formula.column}
                                onChange={(value) =>
                                  onChangeFormula(
                                    index,
                                    formulaIndex,
                                    "column",
                                    value,
                                  )
                                }
                              />
                              <PersonalInput
                                type="text"
                                labelText="Row"
                                value={formula.row}
                                onChange={(value) =>
                                  onChangeFormula(
                                    index,
                                    formulaIndex,
                                    "row",
                                    value,
                                  )
                                }
                              />
                            </div>
                            <PersonalInput
                              type="text"
                              labelText="Formula"
                              value={formula.formula}
                              onChange={(value) =>
                                onChangeFormula(
                                  index,
                                  formulaIndex,
                                  "formula",
                                  value,
                                )
                              }
                            />
                            <div
                              className={`rightButtonsContainer ${styles.queryActions}`}
                            >
                              <PersonalButton
                                text="Remove Formula"
                                type="button"
                                className={`redButton ${styles.compactButton}`}
                                callback={() =>
                                  onRemoveFormula(index, formulaIndex)
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className={`rightButtonsContainer ${styles.mainActions}`}>
                <PersonalButton text="Save All" type="submit" />
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
