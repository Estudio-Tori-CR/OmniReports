"use client";
import React from "react";
import style from "./style.module.css";
import { useRouter } from "next/navigation";
import PersonalButton from "../button";

interface GoBackProps {
  url: string;
}

const GoBack: React.FC<GoBackProps> = ({ url }) => {
  const router = useRouter();

  const onClick = () => {
    router.replace(url);
  };

  return (
    <PersonalButton
      text="Go Back"
      callback={onClick}
      type="button"
      className="redButton"
    />
  );
};

export default GoBack;
