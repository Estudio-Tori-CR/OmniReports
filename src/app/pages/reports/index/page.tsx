"use client";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import AppShell from "../../components/sidebar";
import RoleGuard from "../../components/RolGuard";
import { useRouter } from "next/navigation";
import { TbReportAnalytics } from "react-icons/tb";
import { DBReport } from "@/app/models/Report";
import ReportsReq from "@/app/utilities/requests/reports/requests";
import ActionGuard from "../../components/ActionGuard";
import PersonalButton from "../../components/button";
import Message from "../../components/popups";

const Index = () => {
  const router = useRouter();
  const [reports, setReports] = useState<DBReport[]>([]);
  // we set in true for the fist render
  const [fileImported, setFileImported] = useState(true);

  const client = new ReportsReq();
  const message = new Message();

  useEffect(() => {
    if (fileImported) {
      client.GetAll("").then((response) => {
        if (response.isSuccess && response.body) {
          setReports(response.body);
          setFileImported(false);
        }
      });
    }
  }, [fileImported]);

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    const parent = e.currentTarget;
    const button = parent.querySelector(".edit-button");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    button?.classList.contains("show")
      ? button?.classList.remove("show")
      : button?.classList.add("show");
  };

  const onImport = async () => {
    const fileText = await message.ShowFileText({
      icon: "question",
      title: "Import Report",
    });

    if (!fileText) {
      return;
    }
    const jsonData = JSON.parse(fileText as string);

    const response = await client.Import({
      instances: jsonData.instances,
      report: jsonData.report,
    });

    if (response.isSuccess) {
      await message.Toast({
        icon: "success",
        title: response.message,
      });
    }

    setFileImported(true);
  };

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Reports</h1>
              <p>List of reports</p>
              <ActionGuard allowed={["ADMIN", "DEVELOPER"]}>
                <div className="rightButtonsContainer">
                  <PersonalButton text="Import" callback={onImport} />
                </div>
              </ActionGuard>
            </div>
            <div className="squares-container">
              {reports.map((x) => {
                return (
                  <div className="square" key={x._id?.toString()}>
                    <div
                      role="button"
                      onContextMenu={handleRightClick}
                      onClick={() => {
                        router.push(`/pages/reports/execute?reportId=${x._id}`);
                      }}
                    >
                      <TbReportAnalytics />
                      <div className={style.reportName}>
                        <p>{x.name}</p>
                      </div>
                    </div>
                    <ActionGuard allowed={["ADMIN", "DEVELOPER"]}>
                      <button
                        type="button"
                        className={style.button}
                        onClick={() => {
                          router.push(
                            `/pages/reports/maintenance?reportId=${x._id}`,
                          );
                        }}
                      >
                        Edit
                      </button>
                    </ActionGuard>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Index;
