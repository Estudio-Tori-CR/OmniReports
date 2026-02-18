"use client";
import style from "./page.module.css";
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
        <div className={`container ${style.instancesContainer}`}>
          <div className={`center-container ${style.instancesCard}`}>
            <div className={`form-title ${style.formTitle}`}>
              <h1>Intances</h1>
              <p>List of data base instances</p>
            </div>
            <div className={`squares-container ${style.cardsGrid}`}>
              {instances.map((x) => {
                return (
                  <div
                    className={`square ${style.instanceSquare}`}
                    key={x._id?.toString()}
                    role="button"
                    onClick={() => {
                      router.push(
                        `/pages/instances/maintenance?instanceId=${x._id}`,
                      );
                    }}
                  >
                    <div className={style.iconWrap}>{getIcon(x.type)}</div>
                    <span className={style.cardType}>{x.type}</span>
                    <p className={style.instanceName}>{x.name}</p>
                  </div>
                );
              })}
              {instances.length === 0 && (
                <div className={style.emptyState}>
                  <h3>No instances available</h3>
                  <p>Create a new instance to start linking reports.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
};

export default Index;
