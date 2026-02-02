import Connection from "@/app/interfaces/Connection";
import { MySqlConnection } from "../connections/mySql/connection";
import { SqlServerConnection } from "../connections/sqlServer/connection";
import { OracleDbConnection } from "../connections/oracleDb/connection";

class ReportsDal {
  private connection:
    | MySqlConnection
    | SqlServerConnection
    | OracleDbConnection
    | undefined;
  private Connect = (connectionString: string, dbTye: string) => {
    switch (dbTye) {
      case "OracleDB":
        this.connection = new OracleDbConnection(connectionString);
        break;
      case "MySql":
        this.connection = new MySqlConnection(connectionString);
        break;
      case "SQLServer":
        this.connection = new SqlServerConnection(connectionString);
        break;
    }
  };

  public Execute = (
    connectionString: string,
    dbType: string,
    query: string,
  ) => {
    this.Connect(connectionString, dbType);
    return this.connection?.select(query);
  };
}

export default ReportsDal;
