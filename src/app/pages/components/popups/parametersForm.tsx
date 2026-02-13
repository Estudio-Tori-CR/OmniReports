// ModalForm.tsx
import React from "react";
import PersonalSelect, { SelectOptions } from "../select";
import PersonalInput from "../input";

export interface ParamertersFromValue {
  paramName: string;
  paramLabel: string;
  paramType: string;
  isRequired: boolean;
}

interface Props {
  value: ParamertersFromValue;
  setValue: React.Dispatch<React.SetStateAction<ParamertersFromValue>>;
}

export default function ParamertersFrom({ value, setValue }: Props) {
  const options: SelectOptions[] = [
    {
      text: "Varchar",
      value: "text",
    },
    {
      text: "Integer",
      value: "number",
    },
    {
      text: "Date",
      value: "date",
    },
    {
      text: "Datetime",
      value: "datetime-local",
    },
    {
      text: "List Integer",
      value: "integer-list",
    },
    {
      text: "List Varchar",
      value: "text-list",
    },
  ];

  const isRequired = value.isRequired ? true : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <PersonalInput
        labelText={`Name`}
        type="text"
        value={value.paramName}
        isRequired={true}
        onChange={(e) => setValue((p) => ({ ...p, paramName: e }))}
      />
      <PersonalInput
        labelText={`Label`}
        type="text"
        value={value.paramLabel}
        isRequired={true}
        onChange={(e) => setValue((p) => ({ ...p, paramLabel: e }))}
      />
      <PersonalSelect
        labelText={`Type`}
        options={options}
        value={value.paramType}
        isRequered={true}
        onChange={(e) => setValue((p) => ({ ...p, paramType: e }))}
      />
      <div style={{ display: "flex", gap: "10px", textAlign: "center" }}>
        <input
          type="checkbox"
          id="swal-file-encry"
          checked={isRequired}
          onChange={(e) =>
            setValue((p) => ({ ...p, isRequired: e.target.checked }))
          }
        />
        <label htmlFor="swal-file-encry" style={{ fontSize: "12px" }}>
          Is Required
        </label>
      </div>
    </div>
  );
}
