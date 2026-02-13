"use client";

import { ReactNode, useState } from "react";
import {
  Sidebar,
  Menu,
  MenuItem,
  SubMenu,
  sidebarClasses,
} from "react-pro-sidebar";
import { useRouter } from "next/navigation";
import {
  FaBars,
  FaChartBar,
  FaDatabase,
  FaHome,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";
import { Role } from "@/app/interfaces/Roles";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import Loader from "../loading";

type Props = {
  children: ReactNode;
};

const NAV_LINKS: Array<{ id: string; allowed: Role[] }> = [
  {
    id: "Reports",
    allowed: ["ADMIN", "DEVELOPER", "REPORTS"],
  },
  {
    id: "ReportList",
    allowed: ["ADMIN", "DEVELOPER", "REPORTS"],
  },
  {
    id: "ReportMaintenance",
    allowed: ["ADMIN", "DEVELOPER"],
  },
  {
    id: "Instances",
    allowed: ["ADMIN", "DEVELOPER"],
  },
  {
    id: "InstancesList",
    allowed: ["ADMIN", "DEVELOPER"],
  },
  {
    id: "InstancesMaintenance",
    allowed: ["ADMIN", "DEVELOPER"],
  },
  {
    id: "Users",
    allowed: ["ADMIN"],
  },
];

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const roles = useAppSelector((state) => state.user.role);
  const [collapsed, setCollapsed] = useState(false);

  const canSee = (id: string, children: ReactNode) => {
    if (
      roles.some((r) =>
        NAV_LINKS.some((n) => n.id === id && n.allowed.includes(r)),
      )
    ) {
      return children;
    }
  };

  const navigate = (route: string) => {
    Loader().show();
    router.push(route);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        collapsed={collapsed}
        rootStyles={{
          [`.${sidebarClasses.container}`]: {
            backgroundColor: "#061b2f",
            color: "#dfdfdf",
          },
        }}
      >
        <Menu>
          <MenuItem
            icon={<FaBars />}
            onClick={() => setCollapsed((v) => !v)}
          ></MenuItem>
          <MenuItem
            icon={<FaHome />}
            onClick={() => navigate("/pages/reports/index")}
          >
            Home
          </MenuItem>
          {canSee(
            "Reports",
            <SubMenu icon={<FaChartBar />} label="Reports">
              {canSee(
                "ReportList",
                <MenuItem onClick={() => navigate("/pages/reports/index")}>
                  List
                </MenuItem>,
              )}
              {canSee(
                "ReportMaintenance",
                <MenuItem
                  onClick={() => navigate("/pages/reports/maintenance")}
                >
                  Create
                </MenuItem>,
              )}
            </SubMenu>,
          )}
          {canSee(
            "Instances",
            <SubMenu icon={<FaDatabase />} label="Intances">
              {canSee(
                "InstancesList",
                <MenuItem onClick={() => navigate("/pages/instances/index")}>
                  List
                </MenuItem>,
              )}
              {canSee(
                "InstancesMaintenance",
                <MenuItem
                  onClick={() => navigate("/pages/instances/maintenance")}
                >
                  Create
                </MenuItem>,
              )}
            </SubMenu>,
          )}
          {canSee(
            "Users",
            <SubMenu icon={<FaUsers />} label="Usuarios">
              <MenuItem onClick={() => navigate("/pages/users/index")}>
                List
              </MenuItem>
              <MenuItem onClick={() => navigate("/pages/users/maintenance")}>
                Create
              </MenuItem>
            </SubMenu>,
          )}
          <MenuItem
            icon={<FaUser />}
            onClick={() => navigate("/pages/users/profile")}
          >
            Profile
          </MenuItem>
          <MenuItem icon={<RiLogoutBoxLine />} onClick={() => navigate("/")}>
            Log Out
          </MenuItem>
        </Menu>
      </Sidebar>

      <main
        style={{
          flex: 1,
          padding: "3rem",
          overflow: "auto",
          background: "var(--background)",
          color: "var(--black)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
