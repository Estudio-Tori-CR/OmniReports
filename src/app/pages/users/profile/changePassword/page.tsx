"use client";
import "./page.module.css";
import { useState } from "react";
import type { SubmitEvent } from "react";
import AppShell from "../../../components/sidebar";
import PersonalInput from "../../../components/input";
import PersonalButton from "../../../components/button";
import UsersReq from "@/app/utilities/requests/users/requests";
import RoleGuard from "../../../components/RolGuard";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import Message from "@/app/pages/components/popups";

type ChangePasswordType = {
  currentPassword: string;
  newPassworad: string;
  verifyPassword: string;
};

const ChangePassword = () => {
  const currentUser = useAppSelector((state) => state.user);
  const [password, setPassword] = useState<ChangePasswordType>({
    currentPassword: "",
    newPassworad: "",
    verifyPassword: "",
  });

  const client = new UsersReq();
  const message = new Message();

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    client
      .ValidatePassword(password.currentPassword, currentUser._id)
      .then((response) => {
        if (response.isSuccess && response.body) {
          response.body.password = password.newPassworad;
          client
            .ChangePassword(currentUser._id, response.body)
            .then((response) => {
              message.Toast({
                icon: "success",
                title: response.message,
              });
            });
        }
      });
  };

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Change Password</h1>
              <p>Change your password</p>
            </div>
            <form onSubmit={onSubmit}>
              <PersonalInput
                labelText="Current Password"
                type="password"
                isRequired={true}
                value={password.currentPassword}
                onChange={(e) =>
                  setPassword((u) => ({ ...u, currentPassword: e }))
                }
              />
              <PersonalInput
                labelText="New Password"
                type="password"
                isRequired={true}
                value={password.newPassworad}
                onChange={(e) =>
                  setPassword((u) => ({ ...u, newPassworad: e }))
                }
              />
              <PersonalInput
                labelText="Verify Password"
                type="password"
                isRequired={true}
                value={password.verifyPassword}
                onChange={(e) =>
                  setPassword((u) => ({ ...u, verifyPassword: e }))
                }
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

export default ChangePassword;
