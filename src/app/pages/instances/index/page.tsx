"use client";
import "./page.module.css";
import { useEffect, useState } from "react";
import AppShell from "../../components/sidebar";
import RoleGuard from "../../components/RolGuard";
import { useRouter } from "next/navigation";
import { GrOracle, GrMysql } from "react-icons/gr";
import { DiMsqlServer } from "react-icons/di";
import { Instance } from "@/app/models/Instance";
import IntancesReq from "@/app/utilities/requests/instances/requests";

const Index = () => {
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);

  const client = new IntancesReq(router);

  useEffect(() => {
    client.GetAll("").then((response) => {
      if (response.isSuccess && response.body) {
        setInstances(response.body);
      }
    });
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "OracleDB":
        return <GrOracle />;
      case "MySql":
        return <GrMysql />;
      case "SQLServer":
        return <DiMsqlServer />;
    }
  };

  return (
    <RoleGuard allowed={["ADMIN", "DEVELOPER"]}>
      <AppShell>
        <div className="container">
          <div className="center-container">
            <div className="form-title">
              <h1>Intances</h1>
              <p>List of data base instances</p>
            </div>
            <div className="squares-container">
              {instances.map((x) => {
                return (
                  <div
                    className="square"
                    key={x._id?.toString()}
                    role="button"
                    onClick={() => {
                      router.push(
                        `/pages/instances/maintenance?instanceId=${x._id}`,
                      );
                    }}
                  >
                    {getIcon(x.type)}
                    <p>{x.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Index;
