import Connection from "@/app/interfaces/Connection";
import { MySqlConnection } from "../connections/mySql/connection";
import { SqlServerConnection } from "../connections/sqlServer/connection";

class ReportsDal {
  private connection:
    | Connection
    | MySqlConnection
    | SqlServerConnection
    | undefined;
  private Connect = (connectionString: string, dbTye: string) => {
    switch (dbTye) {
      case "OracleDB":
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
