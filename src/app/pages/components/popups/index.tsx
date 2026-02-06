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

type DirectoryFormValue = {
  name: string;
  path: string;
};

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

  Alert = async (opts: AlertOptions) => {
    const result = await Swal.fire({
      title: opts.title,
      text: opts.message,
      icon: opts.icon,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: !!opts.showCancel,
      confirmButtonColor: "var(--primary-color)",
      cancelButtonColor: "var(--red)",
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");
      },
    } as SweetAlertOptions);

    if (result.isConfirmed && opts.callback) await opts.callback(null);
    if (result.isDismissed && opts.callbackCancel)
      await opts.callbackCancel(null);
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
          Swal.showValidationMessage("Parameter name is required.");
          return false;
        }
        if (!finalValue.paramLabel?.trim()) {
          Swal.showValidationMessage("Parameter label is required.");
          return false;
        }
        if (!finalValue.paramType) {
          Swal.showValidationMessage("Parameter type is required.");
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
          Swal.showValidationMessage("Please select a file to continue.");
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

  async ShowDirectoryForm(opts: ToastOptions, currentPath: string) {
    const normalizePath = (value?: string | null) =>
      (value ?? "")
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/")
        .replace(/^\/|\/$/g, "");

    const normalizedCurrentPath = normalizePath(currentPath);

    const result = await Swal.fire({
      title: opts.title,
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      html: `
      <div style="width:100%; text-align:left;">
        <div style="width:100%; display:grid; margin-bottom:0.75rem;">
          <label for="swal-directory-name" style="text-align:left; margin-bottom:0.5rem; font-size:14px;">
            Directory name
          </label>
          <input
            id="swal-directory-name"
            type="text"
            style="
              width:100%;
              min-height:2rem;
              border:none;
              border-radius:0.25rem;
              padding:0.25rem;
              background-color:#fff;
              border:1px solid var(--gray, #d1d5db);
              box-sizing:border-box;
            "
          />
        </div>
        <div style="font-size:12px; opacity:.8;">
          Current path: /${normalizedCurrentPath}
        </div>
      </div>
    `,
      didOpen: () => {
        document.body.classList.remove("swal2-height-auto");
      },
      preConfirm: () => {
        const rawName = (
          document.getElementById("swal-directory-name") as HTMLInputElement
        )?.value;
        const name = (rawName ?? "").trim();

        if (!name) {
          Swal.showValidationMessage("Directory name is required.");
          return false;
        }

        if (name.includes("/") || name.includes("\\")) {
          Swal.showValidationMessage(
            "Directory name cannot contain '/' or '\\'.",
          );
          return false;
        }

        const path = normalizePath(
          normalizedCurrentPath ? `${normalizedCurrentPath}/${name}` : name,
        );

        return { name, path };
      },
    });

    return (result.value ?? null) as DirectoryFormValue | null;
  }
}

export default Message;
