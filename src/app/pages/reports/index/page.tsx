"use client";
import style from "./page.module.css";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/sidebar";
import RoleGuard from "../../components/RolGuard";
import { useRouter } from "next/navigation";
import { TbReportAnalytics } from "react-icons/tb";
import { DBReport, ExportReport, ReportInt } from "@/app/models/Report";
import ReportsReq from "@/app/utilities/requests/reports/requests";
import ActionGuard from "../../components/ActionGuard";
import PersonalButton from "../../components/button";
import Message from "../../components/popups";
import {
  useAppSelector,
  useAppDispatch,
  setLastPath,
} from "@/app/GlobalState/GlobalState";
import { GoFileDirectory } from "react-icons/go";
import {
  MdDeleteOutline,
  MdOpenInNew,
  MdOutlineSubdirectoryArrowLeft,
} from "react-icons/md";
import { FaHome, FaRegEdit } from "react-icons/fa";
import { Instance } from "@/app/models/Instance";
import IntancesReq from "@/app/utilities/requests/instances/requests";
import { PiExport } from "react-icons/pi";

type DirectoryCardProps = {
  x: string;
  currentPath: string;
  goToDirectory: (directoryName: string) => void;
  onEdit: (name: string, path: string) => Promise<void>;
  canEdit: boolean;
};

const DirectoryCard = ({
  x,
  currentPath,
  goToDirectory,
  onEdit: onEditDirectory,
  canEdit,
}: DirectoryCardProps) => {
  const [menu, setMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const onEdit = () => onEditDirectory(x, `${currentPath}/${x}`);

  const handleMenuOpen = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    setMenu({
      visible: true,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  const closeMenu = () => {
    setMenu((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  return (
    <>
      <div
        className={`${style.reportCard} square`}
        role="button"
        onClick={() => goToDirectory(x)}
      >
        <div className={style.cardIconWrap}>
          <GoFileDirectory />
        </div>
        <div className={style.cardBody}>
          <span className={style.cardType}>Directory</span>
          <div className={style.reportName}>
            <p>{x}</p>
          </div>
        </div>
        <span
          role="button"
          onClick={handleMenuOpen}
          className={style.menuTrigger}
        >
          ...
        </span>
      </div>

      {menu.visible && (
        <div className="contextMenu" style={{ top: menu.y, left: menu.x }}>
          <div onClick={() => goToDirectory(x)}>
            <span>
              <MdOpenInNew />
            </span>
            Open
          </div>
          {canEdit && (
            <div onClick={onEdit}>
              <span>
                <FaRegEdit />
              </span>
              Rename
            </div>
          )}
        </div>
      )}
    </>
  );
};

type ReportCardProps = {
  name: string;
  canEdit: boolean;
  onOpenReport: () => void;
  onEditReport: () => void;
  onDeleteReport?: () => void;
  onExport?: () => void;
};

const ReportCard = ({
  name,
  canEdit,
  onOpenReport,
  onEditReport,
  onDeleteReport,
  onExport,
}: ReportCardProps) => {
  const [menu, setMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const handleMenuOpen = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    setMenu({
      visible: true,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  const closeMenu = () => {
    setMenu((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  return (
    <>
      <div
        className={`${style.reportCard} square`}
        role="button"
        onClick={onOpenReport}
      >
        <div className={style.cardIconWrap}>
          <TbReportAnalytics />
        </div>
        <div className={style.cardBody}>
          <span className={style.cardType}>Report</span>
          <div className={style.reportName}>
            <p>{name}</p>
          </div>
        </div>
        <span
          role="button"
          onClick={handleMenuOpen}
          className={style.menuTrigger}
        >
          ...
        </span>
      </div>

      {menu.visible && (
        <div className="contextMenu" style={{ top: menu.y, left: menu.x }}>
          <div onClick={onOpenReport}>
            <span>
              <MdOpenInNew />
            </span>
            Open
          </div>
          {canEdit && (
            <div onClick={onEditReport}>
              <span>
                <FaRegEdit />
              </span>
              Edit
            </div>
          )}
          {canEdit && onExport && (
            <ActionGuard allowed={["ADMIN"]}>
              <div onClick={onExport}>
                <span>
                  <PiExport />
                </span>
                Export
              </div>
            </ActionGuard>
          )}
          {canEdit && onDeleteReport && (
            <div onClick={onDeleteReport} style={{ color: "var(--red)" }}>
              <span>
                <MdDeleteOutline />
              </span>
              Delete
            </div>
          )}
        </div>
      )}
    </>
  );
};

const Index = () => {
  const router = useRouter();
  const [reports, setReports] = useState<DBReport[]>([]);
  const lastPath = useAppSelector((s) => s.user.lastPathReports);
  const dispatch = useAppDispatch();

  const [currentPath, setCurrentPath] = useState(lastPath ?? "");
  // we set in true for the fist render
  const [fileImported, setFileImported] = useState(true);
  const { role } = useAppSelector((s) => s.user);
  const canEdit = role.includes("ADMIN") || role.includes("DEVELOPER");

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

    client.GetAll().then((response) => {
      if (response.isSuccess && response.body) {
        setReports(response.body);
        setFileImported(false);
      }
    });
  }, [client, fileImported, role]);

  const goToDirectory = (directoryName: string) => {
    const newPath = currentPath
      ? `${currentPath}/${directoryName}`
      : directoryName;
    setCurrentPath(newPath);
    dispatch(setLastPath(newPath));
  };

  const goToParentDirectory = () => {
    const pathParts = normalizePath(currentPath).split("/").filter(Boolean);
    const newPath = pathParts.slice(0, -1).join("/");
    setCurrentPath(newPath);
    dispatch(setLastPath(newPath));
  };

  const goToHome = () => {
    setCurrentPath("");
    dispatch(setLastPath(""));
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
      "",
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

  const onEditDirectory = async (name: string, path: string) => {
    const result = await message.ShowDirectoryForm(
      {
        icon: "success",
        title: "Update a directory",
      },
      currentPath,
      name,
    );

    if (result?.name && result.path) {
      const response = await client.UpdateDirectory(result.name, path, name);

      if (response.isSuccess) {
        setFileImported(true);
      }

      await message.Toast({
        icon: response.isSuccess ? "success" : "error",
        title: response.message,
      });
    }
  };

  const onDeleteReport = async (reportId: string) => {
    const responseReport = await client.GetOne(reportId);
    if (responseReport.isSuccess && responseReport.body) {
      responseReport.body.isActive = false;
      const response = await client.Update(
        reportId,
        responseReport.body as ReportInt,
      );

      await message.Toast({
        icon: response.isSuccess ? "success" : "error",
        title: response.message,
      });

      if (response.isSuccess) {
        setReports((prev) =>
          prev.filter((report) => report._id?.toString() !== reportId),
        );
      }
    }
  };

  const onExportReport = async (reportId: string) => {
    const responseReport = await client.GetOne(reportId);
    if (responseReport.isSuccess && responseReport.body) {
      const isEncrypted: boolean = await message.ShowExportFile({
        icon: "question",
        title: "Export Report",
      });
      const instances = (await new IntancesReq(router).GetAll(true)).body;
      if (isEncrypted !== null && isEncrypted !== undefined) {
        let exportData: ExportReport = {
          report: responseReport.body,
          instances: [],
          isEncrypted: isEncrypted,
        };

        responseReport.body.querys.forEach((x) => {
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
        a.download = responseReport.body.name;
        a.click();

        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className={`container ${style.reportsContainer}`}>
          <div className={`center-container ${style.reportsCard}`}>
            <div className={`form-title ${style.formTitle}`}>
              <h1>Reports</h1>
              <div className={style.headerRow}>
                <p className={style.subtitle}>List of reports</p>
                <ActionGuard allowed={["ADMIN", "DEVELOPER"]}>
                  <div className={style.headerActions}>
                    <PersonalButton
                      text="Import"
                      callback={onImport}
                      className={style.importButton}
                    />
                    <PersonalButton
                      text="Create Directory"
                      className={style.createButton}
                      callback={onCreateDirectory}
                    />
                  </div>
                </ActionGuard>
              </div>
              <div className={style.pathBar}>
                <span className={style.pathLabel}>Current path</span>
                <button
                  type="button"
                  onClick={goToHome}
                  className={style.homeButton}
                >
                  <FaHome />
                </button>
                <strong className={style.pathValue}>{currentPathLabel}</strong>
                <span className={style.itemsCount}>
                  {directories.length + currentReports.length} items
                </span>
              </div>
            </div>
            {currentPath !== "" && (
              <button
                type="button"
                className={style.backButton}
                onClick={() => {
                  goToParentDirectory();
                }}
              >
                <MdOutlineSubdirectoryArrowLeft />
                Back to parent
              </button>
            )}
            <div className={`squares-container ${style.cardsGrid}`}>
              {directories.map((x) => {
                return (
                  <DirectoryCard
                    key={`${currentPath}/${x}`}
                    x={x}
                    currentPath={currentPath}
                    goToDirectory={goToDirectory}
                    onEdit={onEditDirectory}
                    canEdit={canEdit}
                  />
                );
              })}
              {currentReports.map((x) => {
                return (
                  <ReportCard
                    key={x._id?.toString()}
                    name={x.name}
                    canEdit={canEdit}
                    onOpenReport={() => {
                      router.push(`/pages/reports/execute?reportId=${x._id}`);
                    }}
                    onEditReport={() => {
                      router.push(
                        `/pages/reports/maintenance?reportId=${x._id}`,
                      );
                    }}
                    onDeleteReport={() => {
                      onDeleteReport(x._id as string);
                    }}
                    onExport={() => {
                      onExportReport(x._id as string);
                    }}
                  />
                );
              })}
              {directories.length === 0 && currentReports.length === 0 && (
                <div className={style.emptyState}>
                  <h3>No reports in this directory</h3>
                  <p>Create a report or navigate to a different folder.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Index;
