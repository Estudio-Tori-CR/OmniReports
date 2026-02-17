/* eslint-disable @typescript-eslint/no-explicit-any */
import sql, { type config as SqlConfig } from "mssql";

const DB_TIMEOUT_MS = 20 * 60 * 1000;

export class SqlServerConnection{
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  private parseConnectionString(): SqlConfig {
    const parts = this.connectionString
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);

    const dict: Record<string, string> = {};
    for (const part of parts) {
      const idx = part.indexOf("=");
      if (idx === -1) continue;

      const key = part.substring(0, idx).trim().toLowerCase();
      const val = part.substring(idx + 1).trim();
      dict[key] = val;
    }

    const server =
      dict["server"] ?? dict["data source"] ?? dict["host"] ?? "localhost";
    const database = dict["database"] ?? dict["initial catalog"];
    const user = dict["user id"] ?? dict["uid"] ?? dict["user"];
    const password = dict["password"] ?? dict["pwd"] ?? "";
    const port = dict["port"] ? Number(dict["port"]) : undefined;

    // Opcionales comunes en SQL Server connection string
    const encrypt = (dict["encrypt"] ?? "false").toLowerCase() === "true";

    const trustServerCertificate =
      (dict["trustservercertificate"] ?? "false").toLowerCase() === "true";

    if (!database)
      throw new Error(
        "ConnectionString inválido: falta Database/Initial Catalog",
      );
    if (!user) throw new Error("ConnectionString inválido: falta User ID/UID");

    return {
      server,
      database,
      user,
      password,
      connectionTimeout: DB_TIMEOUT_MS,
      requestTimeout: DB_TIMEOUT_MS,
      ...(port ? { port } : {}),
      options: {
        encrypt,
        trustServerCertificate,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }

  public async select(query: string): Promise<any> {
    const config = this.parseConnectionString();

    const pool = await sql.connect(config);

    try {
      const result = await pool.request().query(query);

      if (Array.isArray(result.recordsets) && result.recordsets.length > 0) {
        return result.recordsets[0];
      }

      return result.recordset ?? [];
    } finally {
      await pool.close();
    }
  }
}
