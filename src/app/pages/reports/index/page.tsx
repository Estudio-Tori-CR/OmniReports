"use client";
import style from "./page.module.css";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/sidebar";
import RoleGuard from "../../components/RolGuard";
import { useRouter } from "next/navigation";
import { TbReportAnalytics } from "react-icons/tb";
import { DBReport } from "@/app/models/Report";
import ReportsReq from "@/app/utilities/requests/reports/requests";
import ActionGuard from "../../components/ActionGuard";
import PersonalButton from "../../components/button";
import Message from "../../components/popups";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import { GoFileDirectory } from "react-icons/go";
import { MdOutlineSubdirectoryArrowLeft } from "react-icons/md";

const Index = () => {
  const router = useRouter();
  const [reports, setReports] = useState<DBReport[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  // we set in true for the fist render
  const [fileImported, setFileImported] = useState(true);
  const { role, _id } = useAppSelector((s) => s.user);

  const client = useMemo(() => new ReportsReq(router), [router]);
  const message = new Message();

  const normalizePath = (value?: string | null) =>
    (value ?? "")
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");

  const { directories, currentReports } = useMemo(() => {
    const normalizedCurrentPath = normalizePath(currentPath);
    const currentPathParts = normalizedCurrentPath
      ? normalizedCurrentPath.split("/")
      : [];

    const nextDirectories = new Set<string>();
    const nextReports: DBReport[] = [];

    reports.forEach((report) => {
      const reportPath = normalizePath(report.directory);
      const reportPathParts = reportPath ? reportPath.split("/") : [];

      const isInsidePath = currentPathParts.every(
        (part, index) => reportPathParts[index] === part,
      );

      if (!isInsidePath) {
        return;
      }

      if (reportPathParts.length === currentPathParts.length) {
        nextReports.push(report);
        return;
      }

      nextDirectories.add(reportPathParts[currentPathParts.length]);
    });

    return {
      currentReports: nextReports,
      directories: Array.from(nextDirectories).sort((a, b) =>
        a.localeCompare(b),
      ),
    };
  }, [currentPath, reports]);

  const currentPathLabel = useMemo(() => {
    const normalizedCurrentPath = normalizePath(currentPath);
    return normalizedCurrentPath ? `/${normalizedCurrentPath}` : "/";
  }, [currentPath]);

  useEffect(() => {
    if (!fileImported) {
      return;
    }

    client
      .GetAll(role.includes("ADMIN") ? "" : role, _id as string)
      .then((response) => {
        if (response.isSuccess && response.body) {
          setReports(response.body);
          setFileImported(false);
        }
      });
  }, [client, fileImported, role, _id]);

  const goToDirectory = (directoryName: string) => {
    setCurrentPath((previousPath) =>
      previousPath ? `${previousPath}/${directoryName}` : directoryName,
    );
  };

  const goToParentDirectory = () => {
    setCurrentPath((previousPath) => {
      const pathParts = normalizePath(previousPath).split("/").filter(Boolean);
      return pathParts.slice(0, -1).join("/");
    });
  };

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
    const jsonData = JSON.parse(fileText);

    const response = await client.Import({
      instances: jsonData.instances,
      report: jsonData.report,
      isEncrypted: jsonData.isEncrypted || false,
    });

    if (response.isSuccess) {
      await message.Toast({
        icon: "success",
        title: response.message,
      });
    }

    setFileImported(true);
  };

  const onCreateDirectory = async () => {
    const result = await message.ShowDirectoryForm(
      {
        icon: "success",
        title: "Create a new directory",
      },
      currentPath,
    );

    if (result?.name && result.path) {
      const response = await client.InsertDirectory({
        name: result.name,
        path: result.path,
      });

      if (response.isSuccess) {
        await message.Toast({
          icon: "success",
          title: response.message,
        });
      }
    }
  };

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Reports</h1>
              <div style={{ display: "flex" }}>
                <p style={{ width: "100%" }}>List of reports</p>
                <ActionGuard allowed={["ADMIN", "DEVELOPER"]}>
                  <div className="rightButtonsContainer">
                    <PersonalButton text="Import" callback={onImport} />
                    <PersonalButton
                      text="Create Directory"
                      callback={onCreateDirectory}
                    />
                  </div>
                </ActionGuard>
              </div>
              <p style={{ width: "100%", marginBottom: "0.5rem" }}>
                Current path: <strong>{currentPathLabel}</strong>
              </p>
            </div>
            {currentPath !== "" && (
              <span
                role="button"
                onClick={() => {
                  goToParentDirectory();
                }}
              >
                <MdOutlineSubdirectoryArrowLeft
                  style={{ width: "2rem", height: "2rem", cursor: "pointer" }}
                />
              </span>
            )}
            <div className="squares-container">
              {directories.map((x) => {
                return (
                  <div className="square" key={`${currentPath}/${x}`}>
                    <div
                      role="button"
                      onContextMenu={handleRightClick}
                      onClick={() => {
                        goToDirectory(x);
                      }}
                    >
                      <GoFileDirectory />
                      <div className={style.reportName}>
                        <p>{x}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {currentReports.map((x) => {
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
