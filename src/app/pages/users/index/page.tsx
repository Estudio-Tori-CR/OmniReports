/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import "./page.module.css";
import { use, useEffect, useState } from "react";
import AppShell from "../../components/sidebar";
import UsersReq from "@/app/utilities/requests/users/requests";
import type { User } from "@/app/models/User";
import SortTable from "../../components/table";
import PersonalButton from "../../components/button";
import RoleGuard from "../../components/RolGuard";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/GlobalState/GlobalState";

interface userTable {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  status: string;
}

const Index = () => {
  const router = useRouter();

  const currentUser = useAppSelector((state) => state.user);
  const [usersTable, setUsersTable] = useState<userTable[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const client = new UsersReq();

  useEffect(() => {
    client.GetAll("").then((response) => {
      if (response.isSuccess && response.body) {
        const userTmp: userTable[] = response.body.map((x) => ({
          email: x.email,
          firstName: x.firstName,
          lastName: x.lastName,
          role: x.roles,
          status: x.isActive ? "Active" : "Inactive",
        }));

        setUsersTable(userTmp);
        setUsers(response.body);
      }
    });
  }, []);

  const disableUser = (data: Array<string>) => {
    const email = data[0];
    if (!email) return;

    const user = users.find((x) => x.email === email);
    if (!user?._id) return;

    // 1) optimista: actualizar UI primero
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, isActive: false } : u)),
    );
    setUsersTable((prev) =>
      prev.map((r) => (r.email === email ? { ...r, status: "Inactive" } : r)),
    );

    // 2) guardar en backend
    const updatedUser = { ...user, isActive: false };
    client.Update(user._id.toString(), updatedUser);
  };

  const activeUser = (data: Array<string>) => {
    const email = data[0];
    if (!email) return;

    const user = users.find((x) => x.email === email);
    if (!user?._id) return;

    // 1) optimista: actualizar UI primero
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, isActive: true } : u)),
    );
    setUsersTable((prev) =>
      prev.map((r) => (r.email === email ? { ...r, status: "Active" } : r)),
    );

    // 2) guardar en backend
    const updatedUser = { ...user, isActive: true };
    client.Update(user._id.toString(), updatedUser);
  };

  const editUser = (data: Array<string>) => {
    const email = data[0];
    if (!email) return;

    const user = users.find((x) => x.email === email);
    if (!user?._id) return;

    router.replace(`/pages/users/maintenance?userID=${user._id}`);
  };

  return (
    <RoleGuard allowed={["ADMIN"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <SortTable
              columnsNames={
                [
                  "Email",
                  "First Name",
                  "Last Name",
                  "Role",
                  "Status",
                ] as unknown as any
              }
              rows={usersTable}
              max={10}
              buttons={
                [
                  (row: any) => {
                    if (row[0] !== currentUser.email) {
                      return (
                        <PersonalButton
                          text="Edit"
                          isPrimary={true}
                          callback={() => editUser(row)}
                        />
                      );
                    }
                  },
                  (row: any) => {
                    if (row[0] !== currentUser.email) {
                      if (row[4] === "Active") {
                        return (
                          <PersonalButton
                            text="Delete"
                            className="redButton"
                            isPrimary={true}
                            callback={() => disableUser(row)}
                          />
                        );
                      } else {
                        return (
                          <PersonalButton
                            text="Active"
                            isPrimary={true}
                            callback={() => activeUser(row)}
                          />
                        );
                      }
                    }
                  },
                ] as unknown as any
              }
            />
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Index;
