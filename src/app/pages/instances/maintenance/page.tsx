"use client";
import "./page.module.css";
import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/sidebar";
import IntancesReq from "@/app/utilities/requests/instances/requests";
import PersonalInput from "../../components/input";
import PersonalSelect from "../../components/select";
import PersonalButton from "../../components/button";
import RoleGuard from "../../components/RolGuard";
import { InstanceInt } from "@/app/models/Instance";
import BaseResponse from "@/app/models/baseResponse";
import Message from "../../components/popups";
import ActionGuard from "../../components/ActionGuard";

const Maintenance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [instance, setInstance] = useState<InstanceInt>({
    name: "",
    connectionString: "",
    type: "",
    isActive: true,
  });

  const client = new IntancesReq();
  const message = new Message();
  const instanceId = searchParams.get("instanceId") ?? "";

  useEffect(() => {
    client.GetOne(instanceId).then((response) => {
      if (response.isSuccess && response.body) {
        setInstance(response.body as InstanceInt);
      }
    });
  }, [instanceId]);

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    let response = new BaseResponse();
    if (instanceId) {
      response = await client.Update(instanceId, instance);
    } else {
      response = await client.Insert(instance);
    }

    if (response.isSuccess) {
      await message.Toast({
        icon: "success",
        title: response.message,
      });
    }

    if (response.isSuccess) {
      router.replace(`/pages/instances/index`);
    }
  };

  const onDelete = () => {
    const instanceTmp = { ...instance };
    instanceTmp.isActive = false;
    client.Update(instanceId, instanceTmp).then((response) => {
      message.Toast({
        icon: response.isSuccess ? "success" : "error",
        title: response.message,
      });

      if (response.isSuccess) {
        router.replace(`/pages/instances/index`);
      }
    });
  };

  return (
    <AppShell>
      <RoleGuard allowed={["ADMIN", "DEVELOPER"]}>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Intances Maintenance</h1>
              <p>Create or update a data base instance</p>
            </div>
            <form onSubmit={onSubmit}>
              <PersonalInput
                labelText="Instance Name"
                type="text"
                isRequired={true}
                value={instance?.name}
                onChange={(e) => setInstance((i) => ({ ...i, name: e }))}
              />
              <PersonalInput
                labelText="Connection String"
                type="textarea"
                isRequired={true}
                value={instance?.connectionString}
                placeholder="Server=localhost;Port=3306;Database=employees_small;User ID=root;Password=root;SslMode=Preferred;Connection Timeout=15;Default Command Timeout=30;Allow User Variables=true"
                onChange={(e) =>
                  setInstance((i) => ({ ...i, connectionString: e }))
                }
              />
              <PersonalSelect
                labelText="Intance Type"
                options={[
                  { text: "OracleDB", value: "OracleDB" },
                  { text: "MySql", value: "MySql" },
                  { text: "SQLServer", value: "SQLServer" },
                ]}
                value={instance?.type}
                isRequered={true}
                onChange={(e) => setInstance((i) => ({ ...i, type: e }))}
              />
              <div className="rightButtonsContainer">
                {instanceId && (
                  <ActionGuard allowed={["ADMIN"]}>
                    <PersonalButton
                      text="Delete"
                      type="button"
                      className="redButton"
                      callback={onDelete}
                    />
                  </ActionGuard>
                )}
                <PersonalButton text="Submit" type="submit" />
              </div>
            </form>
          </div>
        </div>
      </RoleGuard>
    </AppShell>
  );
};

export default Maintenance;
