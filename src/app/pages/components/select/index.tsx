"use client";
import React from "react";
import style from "./style.module.css";

interface SelectProps {
  labelText: string;
  id?: string;
  options: Array<SelectOptions>;
  value: string | undefined;
  isRequered?: boolean;
  disable?: boolean;
  onChange: (value: string) => void;
}

export interface SelectOptions {
  text: string;
  value: string;
  selected?: boolean;
}

const PersonalSelect: React.FC<SelectProps> = ({
  labelText,
  id,
  options,
  value,
  isRequered = false,
  disable = false,
  onChange,
}) => {
  const inputId = id || labelText.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={style.container}>
      <label className={style.label} htmlFor={inputId}>
        {labelText}
        {isRequered ? <span style={{ color: "red" }}>*</span> : null}
      </label>
      <select
        className={style.select}
        id={inputId}
        spellCheck={false}
        data-ms-editor="true"
        value={value ?? ""}
        disabled={disable}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        <option value="" key={-1}></option>
        {options.map((item, index) => {
          return (
            <option value={item.value} key={index}>
              {item.text}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default PersonalSelect;
