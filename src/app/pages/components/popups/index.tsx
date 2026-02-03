/* eslint-disable @typescript-eslint/no-explicit-any */
import Swal, { SweetAlertOptions } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ParamertersFrom, { ParamertersFromValue } from "./parametersForm";
import React from "react";

type IconType = "error" | "warning" | "success" | "info" | "question";

interface ToastOptions {
  icon: IconType;
  title: string;
}

interface AlertOptions {
  icon: IconType;
  title: string;
  message: string;
  showCancel?: boolean;
  callback?: (value: any) => Promise<void>;
  callbackCancel?: (value: any) => Promise<void>;
}

class Message {
  Toast = (opts: ToastOptions) => {
    withReactContent(Swal).fire({
      position: "top-end",
      icon: opts.icon,
      title: opts.title,
      showConfirmButton: false,
      timer: 1500,
      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");
      },
    });
  };

  Alert = (opts: AlertOptions) => {
    Swal.fire({
      title: opts.title,
      text: opts.message,
      icon: opts.icon,
      showCancelButton: !!opts.showCancel,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");
      },
    } as SweetAlertOptions).then(async (result) => {
      if (result.isConfirmed && opts.callback) await opts.callback(null);
      if (result.isDismissed && opts.callbackCancel)
        await opts.callbackCancel(null);
    });
  };

  async ShowParametersUser(
    opts: ToastOptions,
    form: ParamertersFromValue | null = null,
  ) {

    const initialValue: ParamertersFromValue = form ?? {
      paramName: "",
      paramType: "",
      paramLabel: "",
    };

    let finalValue: ParamertersFromValue = initialValue;

    const Wrapper = () => {
      const [formValue, setFormValue] =
        React.useState<ParamertersFromValue>(initialValue);

      React.useEffect(() => {
        finalValue = formValue;
      }, [formValue]);

      return <ParamertersFrom value={formValue} setValue={setFormValue} />;
    };

    const result = await withReactContent(Swal).fire({
      title: opts.title,
      showCancelButton: true,
      confirmButtonText: "Add",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      html: <Wrapper />,
      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");
      },
      preConfirm: () => {
        if (!finalValue.paramName?.trim()) {
          Swal.showValidationMessage("Name is required");
          return false;
        }
        if (!finalValue.paramLabel?.trim()) {
          Swal.showValidationMessage("Label is required");
          return false;
        }
        if (!finalValue.paramType) {
          Swal.showValidationMessage("Type is required");
          return false;
        }
        return finalValue;
      },
    });

    return (result.value ?? null) as ParamertersFromValue | null;
  }

  async ShowFileText(opts: ToastOptions) {
    const readFileAsText = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    };

    let selectedFile: File | null = null;

    const result = await Swal.fire({
      title: opts.title,
      showCancelButton: true,
      confirmButtonText: "Load",
      cancelButtonText: "Cancel",
      focusConfirm: false,

      // HTML puro
      html: `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
        <label for="swal-file" style="font-size:14px;">Select a file</label>
        <input id="swal-file" type="file" accept=".json"/>
        <div id="swal-file-name" style="font-size:12px; opacity:.8;"></div>
      </div>
    `,

      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");

        const input = document.getElementById(
          "swal-file",
        ) as HTMLInputElement | null;
        const nameDiv = document.getElementById(
          "swal-file-name",
        ) as HTMLDivElement | null;

        input?.addEventListener("change", () => {
          selectedFile = input.files?.[0] ?? null;
          if (nameDiv)
            nameDiv.textContent = selectedFile ? selectedFile.name : "";
        });
      },

      preConfirm: async () => {
        if (!selectedFile) {
          Swal.showValidationMessage("You must select a file");
          return false;
        }
        const text = await readFileAsText(selectedFile);
        return text;
      },
    });

    return (result.value ?? null) as string | null;
  }

  async ShowExportFile(opts: ToastOptions) {
    let encryptFile: boolean | undefined | null = null;

    const result = await Swal.fire({
      title: opts.title,
      showCancelButton: true,
      confirmButtonText: "Export",
      cancelButtonText: "Cancel",
      focusConfirm: false,

      // HTML puro
      html: `
      <div style="display:flex; gap:10px; text-align:center;">
        <input type="checkbox" id="swal-file-encry" />
        <label for="swal-file-encry" style="font-size:12px;">Encrypt file</label>
      </div>
    `,

      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");
        encryptFile = (
          document.getElementById("swal-file-encry") as HTMLInputElement | null
        )?.checked;
      },

      preConfirm: async () => {
        encryptFile = (
          document.getElementById("swal-file-encry") as HTMLInputElement | null
        )?.checked;
        return { encrypt: encryptFile };
      },
      preDeny() {
        encryptFile = null;
      },
    });

    return result.value?.encrypt;
  }
}

export default Message;
