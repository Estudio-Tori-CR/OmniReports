"use client";
import { useRouter } from "next/navigation";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import PersonalButton from "../components/button";
import AuthenticatorReq from "@/app/utilities/requests/authenticator/requests";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import Message from "../components/popups";

export default function Authenticator() {
  const router = useRouter();
  const { _id } = useAppSelector((s) => s.user);

  const [length, setLength] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [token, setToken] = useState<string>("");

  const client = new AuthenticatorReq();

  const sendAuthenticator = () => {
    client.Send(_id).then((response) => {
      console.log(response);
    });
  };

  useEffect(() => {
    sendAuthenticator();
  }, []);

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    client.Validate(_id, token).then((response) => {
      if (response.isSuccess) {
        router.replace("/pages/reports/index");
      } else {
        new Message().Toast({
          icon: "error",
          title: response.message,
        });
      }
    });
  };

  const changeFocus = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextId: string,
    previousId: string,
  ) => {
    if (e.key === "Backspace") {
      try {
        document.getElementById(previousId)?.focus();
      } catch {}
    } else if (e.key.length === 1) {
      try {
        document.getElementById(nextId)?.focus();
      } catch {}
    }
  };

  return (
    <div className={style.loginContainer}>
      <div className={style.loginInputsContainer}>
        <img
          src="../icon.png"
          alt="icon"
          className="icon"
          style={{ width: "250px", height: "200px" }}
        />
        <form onSubmit={onSubmit}>
          <h2>Validate your token</h2>
          <div className={style.inputsContainer}>
            {length.map((x) => {
              return (
                <input
                  key={x}
                  id={`token_input_${x}`}
                  className={style.tokenInput}
                  maxLength={1}
                  onChange={(e) => {
                    const value = e.target.value;
                    const copy = [...token];

                    if (copy[x]) {
                      copy[x] = value;
                    } else {
                      copy.push(value);
                    }
                    setToken(copy.join(""));
                  }}
                  onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    changeFocus(
                      e,
                      `token_input_${x + 1}`,
                      `token_input_${x - 1}`,
                    );
                  }}
                />
              );
            })}
          </div>
          <PersonalButton text="Validate" type="submit" />
        </form>
      </div>
    </div>
  );
}
