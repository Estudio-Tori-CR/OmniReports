"use client";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import AppShell from "../../../components/sidebar";
import PersonalInput from "../../../components/input";
import PersonalButton from "../../../components/button";
import UsersReq from "@/app/utilities/requests/users/requests";
import RoleGuard from "../../../components/RolGuard";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import Message from "@/app/pages/components/popups";
import { useRouter } from "next/navigation";
import GoBack from "@/app/pages/components/goBack";
import SettingsReq from "@/app/utilities/requests/settings/requests";
import { SettingsPassword } from "@/app/models/settings";

type ChangePasswordType = {
  currentPassword: string;
  newPassworad: string;
  verifyPassword: string;
};

const ChangePassword = () => {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.user);
  const [password, setPassword] = useState<ChangePasswordType>({
    currentPassword: "",
    newPassworad: "",
    verifyPassword: "",
  });
  const [settings, setSettings] = useState<SettingsPassword>();
  const [passwordLevel, setPasswordLevel] = useState<number>(0);

  const client = new UsersReq(router);
  const clientSettings = new SettingsReq(router);
  const message = new Message();

  useEffect(() => {
    clientSettings.GetPasswordSettings().then((response) => {
      if (response.isSuccess && response.body) {
        setSettings(response.body);
      } else {
        message.Toast({
          icon: "error",
          title: response.message,
        });
      }
    });
  }, []);

  useEffect(() => {
    let level: number = 0;
    if (
      settings?.high &&
      new RegExp(settings.high).test(password.newPassworad) &&
      password.newPassworad.length >= settings.length
    ) {
      level = 3;
    } else if (
      settings?.medium &&
      new RegExp(settings.medium).test(password.newPassworad)
    ) {
      level = 2;
    } else if (
      settings?.low &&
      new RegExp(settings.low).test(password.newPassworad)
    ) {
      level = 1;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPasswordLevel(level);
  }, [password, settings]);

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (passwordLevel === 3) {
      if (password.newPassworad === password.verifyPassword) {
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
      } else {
        message.Toast({
          icon: "info",
          title: "Your passwords doesn't match",
        });
      }
    } else {
      message.Toast({
        icon: "info",
        title: "Your password needs to be HIGH",
      });
    }
  };

  const passwordLevelLabel =
    passwordLevel === 1 ? "Low" : passwordLevel === 2 ? "Medium" : "High";
  const passwordLevelClass =
    passwordLevel === 1
      ? style.passwordLow
      : passwordLevel === 2
        ? style.passwordMedium
        : style.passwordHigh;

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER", "REPORTS"]}>
      <AppShell>
        <div className={`container ${style.pageContainer}`}>
          <div className={`center-container ${style.pageCard}`}>
            <div className={`form-title ${style.formTitle}`}>
              <h1>Change Password</h1>
              <p>Change your password</p>
            </div>
            <form onSubmit={onSubmit} className={style.formContent}>
              <PersonalInput
                labelText="Current Password"
                type="password"
                isRequired={true}
                value={password.currentPassword}
                onChange={(e) =>
                  setPassword((u) => ({ ...u, currentPassword: e }))
                }
              />
              <div className={style.newPassword}>
                <PersonalInput
                  labelText="New Password"
                  type="password"
                  isRequired={true}
                  value={password.newPassworad}
                  onChange={(e) =>
                    setPassword((u) => ({ ...u, newPassworad: e }))
                  }
                />
                {passwordLevel !== 0 && (
                  <div
                    className={`${style.passwordStrength} ${passwordLevelClass}`}
                  >
                    <div className={style.passwordStrengthHeader}>
                      <span>Password strength</span>
                      <span className={style.passwordStrengthValue}>
                        {passwordLevelLabel}
                      </span>
                    </div>
                    <div className={style.passwordStrengthTrack}>
                      <span className={style.passwordStrengthFill} />
                    </div>
                  </div>
                )}
              </div>
              <PersonalInput
                labelText="Verify Password"
                type="password"
                isRequired={true}
                value={password.verifyPassword}
                onChange={(e) =>
                  setPassword((u) => ({ ...u, verifyPassword: e }))
                }
              />
              {password.newPassworad !== password.verifyPassword && (
                <p className={style.passwordMismatch}>
                  Your password does not match
                </p>
              )}
              <div className={`rightButtonsContainer ${style.actions}`}>
                <PersonalButton text="Submit" type="submit" />
                <GoBack url="/pages/users/profile" />
              </div>
            </form>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default ChangePassword;
