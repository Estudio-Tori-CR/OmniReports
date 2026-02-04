"use client";
import "./page.module.css";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../components/sidebar";
import PersonalInput from "../../components/input";
import PersonalButton from "../../components/button";
import UsersReq from "@/app/utilities/requests/users/requests";
import type { UserInt } from "@/app/models/User";
import PersonalSelect from "../../components/select";
import RoleGuard from "../../components/RolGuard";
import Message from "../../components/popups";
import BaseResponse from "@/app/models/baseResponse";
import { useRouter } from "next/navigation";

const Maintenance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userID = searchParams.get("userID") ?? "";

  const [user, setUser] = useState<UserInt>({
    firstName: "",
    lastName: "",
    email: "",
    roles: "",
    reports: [],
    isActive: true,
  });

  const client = new UsersReq();
  const message = new Message();

  useEffect(() => {
    client.GetOne(userID).then((response) => {
      if (response.isSuccess && response.body) {
        setUser(response.body);
      } else {
        setUser({
          firstName: "",
          lastName: "",
          email: "",
          roles: "",
          reports: [],
          isActive: true,
        });
      }
    });
  }, [userID]);

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    let response: BaseResponse<null> = new BaseResponse();
    if (userID) {
      response = await client.Update(userID, user);
    } else {
      response = await client.Insert(user);
    }

    if (response.isSuccess) {
      await message.Toast({
        icon: "success",
        title: response.message,
      });
    }

    if (response.isSuccess) {
      router.replace(`/pages/users/index`);
    }
  };

  return (
    <RoleGuard allowed={["ADMIN"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <form onSubmit={onSubmit}>
              <div className="form-title">
                <h1>User Maintenance</h1>
                <p>Create or update a user profile</p>
              </div>
              <PersonalInput
                labelText="First Name"
                type="text"
                isRequired={true}
                value={user.firstName}
                onChange={(e) => setUser((u) => ({ ...u, firstName: e }))}
              />
              <PersonalInput
                labelText="Last Name"
                type="text"
                isRequired={true}
                value={user.lastName}
                onChange={(e) => setUser((u) => ({ ...u, lastName: e }))}
              />
              <PersonalInput
                labelText="Email"
                type="email"
                isRequired={true}
                value={user.email}
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
                onChange={(e) => setUser((u) => ({ ...u, roles: e }))}
              />
              <div className="rightButtonsContainer">
                <PersonalButton text="Submit" type="submit" />
              </div>
            </form>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Maintenance;
