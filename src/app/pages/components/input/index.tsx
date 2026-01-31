"use client";
import React from "react";
import style from "./style.module.css";

interface InputProps {
  labelText: string;
  id?: string;
  value?: string;
  type: string;
  placeholder?: string;
  readOnly?: boolean;
  isRequired?: boolean;
  min?: number;
  disable?: boolean;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}

const PersonalInput: React.FC<InputProps> = ({
  labelText,
  id,
  value,
  type,
  placeholder = "",
  readOnly = false,
  isRequired = false,
  min = 0,
  disable = false,
  onChange = () => {},
  onBlur = () => {},
}) => {
  const inputId = id || labelText.toLowerCase().replace(/\s+/g, "-");

  const GetInputType = () => {
    if (type === "textarea") {
      return (
        <textarea
          className={style.input}
          id={inputId}
          value={value}
          spellCheck={false}
          readOnly={readOnly}
          required={isRequired}
          disabled={disable}
          rows={8}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            onBlur(e.target.value);
          }}
        />
      );
    } else {
      return (
        <input
          className={style.input}
          id={inputId}
          type={type}
          value={value}
          spellCheck={false}
          readOnly={readOnly}
          required={isRequired}
          min={min}
          disabled={disable}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            onBlur(e.target.value);
          }}
        />
      );
    }
  };

  return (
    <div className={style.container}>
      <label className={style.label} htmlFor={inputId}>
        {labelText}{" "}
        {isRequired ? (
          <span style={{ color: "red" }}>{min != 0 ? `[${min}]` : null}*</span>
        ) : null}
      </label>
      {GetInputType()}
    </div>
  );
};

export default PersonalInput;
