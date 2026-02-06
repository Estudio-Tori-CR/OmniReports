"use client";
import "./page.module.css";
import { use, useEffect, useState } from "react";
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

  const onSubmit = async () => {
    await client.Update(userID, user);
  };

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <div
              className="form-title"
              style={{ display: "inline-flex", width: "100%" }}
            >
              <h1 style={{ width: "15rem" }}>User Profile</h1>
              <div className="rightButtonsContainer">
                <PersonalButton
                  text="Change Password"
                  type="button"
                  callback={() => {
                    route.replace("/pages/users/profile/changePassword");
                  }}
                />
              </div>
            </div>
            <form>
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
              <div className="rightButtonsContainer">
                <PersonalButton
                  text="Submit"
                  type="button"
                  callback={onSubmit}
                />
              </div>
            </form>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Profile;
