"use client";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import PersonalInput from "./pages/components/input";
import PersonalButton from "./pages/components/button";
import style from "./page.module.css";
import "./globals.css";
import { useEffect, useState } from "react";
import { setUser, useAppDispatch } from "./GlobalState/GlobalState";
import UsersReq from "./utilities/requests/users/requests";
import { removeToken } from "./utilities/Middleware";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      setUser({
        _id: "",
        email: "",
        fullName: "",
        role: [],
      }),
    );
    removeToken();
  }, []);

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    LogIn();
  };

  const LogIn = async () => {
    const usersReq = new UsersReq();
    usersReq.LogIn(username, password).then((response) => {
      if (response.isSuccess && response.body) {
        dispatch(
          setUser({
            _id: response.body._id?.toString() as string,
            email: response.body.email,
            fullName: `${response.body.firstName} ${response.body.lastName}`,
            role: [response.body.roles],
          }),
        );
        router.replace("/pages/authenticator");
      }
    });
  };

  return (
    <div className={style.loginContainer}>
      <div className={style.loginInputsContainer}>
        <img
          src="./icon.png"
          alt="icon"
          className="icon"
          style={{ width: "250px", height: "200px" }}
        />
        <form onSubmit={onSubmit}>
          <PersonalInput
            labelText="Email"
            type="text"
            value={username}
            onChange={setUsername}
          />
          <PersonalInput
            labelText="Password"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <PersonalButton
            text="Log In"
            isPrimary={true}
            type="submit"
          />
        </form>
      </div>
    </div>
  );
}
