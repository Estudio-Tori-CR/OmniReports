"use client";
import style from "./page.module.css";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/sidebar";
import RoleGuard from "../../components/RolGuard";
import { useRouter } from "next/navigation";
import { TbReportAnalytics } from "react-icons/tb";
import { DBReport, ReportInt } from "@/app/models/Report";
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
import { MdOutlineSubdirectoryArrowLeft } from "react-icons/md";
import { FaHome } from "react-icons/fa";

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
        <div>
          <GoFileDirectory />
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
          <div onClick={() => goToDirectory(x)}>Open</div>
          {canEdit && <div onClick={onEdit}>Edit</div>}
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
};

const ReportCard = ({
  name,
  canEdit,
  onOpenReport,
  onEditReport,
  onDeleteReport,
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
        <div>
          <TbReportAnalytics />
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
          <div onClick={onOpenReport}>Open</div>
          {canEdit && <div onClick={onEditReport}>Edit</div>}
          {canEdit && onDeleteReport && (
            <div onClick={onDeleteReport}>Delete</div>
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
  const { role, _id } = useAppSelector((s) => s.user);
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
    debugger;
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
                Current path
                <span onClick={goToHome} className={style.home}>
                  <FaHome />
                </span>
                : <strong>{currentPathLabel}</strong>
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
                  />
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
