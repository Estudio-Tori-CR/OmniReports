"use client";
import React, { useCallback } from "react";
import style from "./style.module.css";

interface ButtonProps {
  text: string;
  type?: "submit" | "button";
  id?: string;
  callback?: () => void;
  className?: string;
  isPrimary?: boolean;
}

const PersonalButton: React.FC<ButtonProps> = ({
  text,
  type = "button",
  id,
  callback,
  className,
  isPrimary = true,
}) => {
  const onClick = useCallback(() => {
    if (callback) {
      callback();
    }
  }, [callback]);

  if (id && id.trim() !== "") id = id;

  className = `${style.button} ${className} ${
    isPrimary ? "" : style.buttonSecondary
  }`;

  // if (type === "submit") {
  //   type = "button";

  //   const submit = (e: KeyboardEvent) => {
  //     if (e.key === "Enter" && callback !== null) {
  //       (callback as () => void)();
  //     }
  //   };
  //   document.removeEventListener("keydown", submit);
  //   document.addEventListener("keydown", submit);
  // }

  return (
    <button type={type} id={id} className={className} onClick={onClick}>
      {text}
    </button>
  );
};

export default PersonalButton;
