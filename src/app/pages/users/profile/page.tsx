"use client";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/sidebar";
import PersonalInput from "../../components/input";
import PersonalButton from "../../components/button";
import UsersReq from "@/app/utilities/requests/users/requests";
import type { UserInt } from "@/app/models/User";
import PersonalSelect from "../../components/select";
import RoleGuard from "../../components/RolGuard";
import { useAppSelector } from "@/app/GlobalState/GlobalState";

const Profile = () => {
  const route = useRouter();
  const searchParams = useSearchParams();
  const userID = searchParams.get("userID") ?? "";
  const currentUser = useAppSelector((state) => state.user);
  const [user, setUser] = useState<UserInt>({
    firstName: "",
    lastName: "",
    email: "",
    roles: "",
    reports: [],
    isActive: true,
  });

  const client = new UsersReq(route);

  useEffect(() => {
    client.GetOne(currentUser._id).then((response) => {
      if (response.isSuccess && response.body) {
        setUser(response.body);
      }
    });
  }, [userID]);

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className={`container ${style.pageContainer}`}>
          <div className={`center-container ${style.pageCard}`}>
            <div className={`form-title ${style.formTitle}`}>
              <div className={style.headerRow}>
                <h1>User Profile</h1>
                <div className={`rightButtonsContainer ${style.headerActions}`}>
                  <PersonalButton
                    text="Change Password"
                    type="button"
                    className={style.compactButton}
                    callback={() => {
                      route.replace("/pages/users/profile/changePassword");
                    }}
                  />
                </div>
              </div>
            </div>
            <form className={style.formContent}>
              <div className={style.profileGrid}>
                <PersonalInput
                  labelText="First Name"
                  type="text"
                  isRequired={true}
                  value={user.firstName}
                  disable={true}
                  onChange={(e) => setUser((u) => ({ ...u, firstName: e }))}
                />
                <PersonalInput
                  labelText="Last Name"
                  type="text"
                  isRequired={true}
                  value={user.lastName}
                  disable={true}
                  onChange={(e) => setUser((u) => ({ ...u, lastName: e }))}
                />
              </div>
              <PersonalInput
                labelText="Email"
                type="email"
                isRequired={true}
                value={user.email}
                disable={true}
                onChange={(e) => setUser((u) => ({ ...u, email: e }))}
              />
              <PersonalSelect
                labelText="Role"
                options={[
                  { text: "Administrator", value: "ADMIN" },
                  { text: "Developer", value: "DEVELOPER" },
                  { text: "Reports", value: "REPORTS" },
                ]}
                value={user.roles}
                isRequered={true}
                disable={true}
                onChange={(e) => setUser((u) => ({ ...u, roles: e }))}
              />
            </form>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Profile;
