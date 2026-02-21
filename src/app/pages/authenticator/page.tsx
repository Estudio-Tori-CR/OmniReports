"use client";
import { useRouter } from "next/navigation";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import type { CSSProperties } from "react";
import PersonalButton from "../components/button";
import AuthenticatorReq from "@/app/utilities/requests/authenticator/requests";
import Message from "../components/popups";

export default function Authenticator() {
  const router = useRouter();

  const [length, setLength] = useState<number[]>([]);
  const [token, setToken] = useState<string>("");
  const [seconds, setSeconds] = useState<number>(30);

  const client = new AuthenticatorReq(router);

  const sendAuthenticator = () => {
    client.Send().then((response) => {
      new Message().Toast({
        icon: response.isSuccess ? "success" : "error",
        title: response.message,
      });
      if (response.isSuccess && response.body) {
        const copy = [];
        for (let i = 0; i < response.body.length; i++) {
          copy.push(i);
        }

        setSeconds(30);
        const timer = setInterval(() => {
          setSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setLength(copy);
      }
    });
  };

  useEffect(() => {
    sendAuthenticator();
  }, []);

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    client.Validate(token).then((response) => {
      if (response.isSuccess) {
        router.replace("/pages/reports/index");
      } else {
        new Message().Toast({
          icon: "error",
          title: response.message,
        });

        const inputs = document.querySelectorAll<HTMLInputElement>(
          '[id^="token_input_"]',
        );
        for (let i = 0; i < inputs.length; i++) {
          const element = inputs[i];
          element.value = "";
        }
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

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").replace(/\s+/g, "");
    setToken(pasted);
    for (let i = 0; i < pasted.length; i++) {
      const element = pasted[i];
      const input = document.getElementById(
        `token_input_${i}`,
      ) as HTMLInputElement | null;
      if (input) {
        input.value = element;

        if (i === pasted.length - 1) {
          input.focus();
        }
      }
    }
  };
  const tokenLength = length.length;
  const inputsContainerStyle = {
    "--token-columns-desktop": String(Math.max(tokenLength, 1)),
    "--token-columns-mobile": String(Math.max(Math.ceil(tokenLength / 2), 1)),
  } as CSSProperties;

  return (
    <div className={style.loginContainer}>
      <div className={style.loginContent}>
        <div className={style.loginInputsContainer}>
          <div className={style.brandSection}>
            <img src="../icon.png" alt="icon" className={style.brandIcon} />
          </div>
          <form onSubmit={onSubmit} className={style.formContent}>
            <h2>Validate your token</h2>
            <p className={style.subtitle}>
              Enter the verification code sent to your email.
            </p>
            <div className={style.inputsContainer} style={inputsContainerStyle}>
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
                    onPaste={onPaste}
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
            <div className={style.sendAgainContainer}>
              {seconds > 0 && (
                <p className={style.waitToSend}>{seconds}s to send again</p>
              )}
              {seconds === 0 && (
                <button
                  type="button"
                  onClick={sendAuthenticator}
                  className={style.sendAgain}
                >
                  Send Again
                </button>
              )}
            </div>
            <div className={style.actions}>
              <PersonalButton text="Validate" type="submit" />
            </div>
          </form>
        </div>
      </div>
      <footer className={style.pageFooter}>
        <div className={style.footerBadge}>
          <span className={style.footerBrand}>OmniReports</span>
          <span className={style.footerSeparator}>|</span>
          <span>Proprietary software of Estudio-Tori. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
