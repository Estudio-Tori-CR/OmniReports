/* eslint-disable @typescript-eslint/no-explicit-any */
import oracledb, { type ConnectionAttributes } from "oracledb";

const DB_TIMEOUT_MS = 20 * 60 * 1000;

export class OracleDbConnection {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  private parseConnectionString(): ConnectionAttributes {
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

    const host =
      dict["server"] ?? dict["host"] ?? dict["data source"] ?? "localhost";
    const port = dict["port"] ? Number(dict["port"]) : 1521;

    const serviceName =
      dict["database"] ?? dict["service name"] ?? dict["servicename"];
    const sid = dict["sid"];

    const user = dict["user id"] ?? dict["uid"] ?? dict["user"];
    const password = dict["password"] ?? dict["pwd"] ?? "";

    if (!user) throw new Error("ConnectionString inválido: falta User ID/UID");
    if (!password)
      throw new Error("ConnectionString inválido: falta Password/PWD");
    if (!serviceName && !sid)
      throw new Error(
        "ConnectionString inválido: falta Database/ServiceName o SID",
      );

    // Si viene sid usamos SID, si no SERVICE_NAME
    const connectString = sid
      ? `${host}:${port}/${sid}`
      : `${host}:${port}/${serviceName}`;

    return {
      user,
      password,
      connectString,
    };
  }

  public async select(query: string): Promise<any[]> {
    const config = this.parseConnectionString();
    const conn = await oracledb.getConnection(config);
    conn.callTimeout = DB_TIMEOUT_MS;
    try {
      const sql = query.trim().replace(/;$/, "");

      const result = await conn.execute(sql, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const rows: any = result.rows ?? [];

      if (this.isFunctionCallSelect(sql)) {
        if (rows && typeof rows === "object") {
          const values = Object.values(rows);

          const arr = values.find((v) => Array.isArray(v));
          if (Array.isArray(arr)) return arr as any[];

          for (const v of values) {
            if (v && typeof v === "object") {
              const innerArr = Object.values(v as any).find((x) =>
                Array.isArray(x),
              );
              if (Array.isArray(innerArr)) return innerArr as any[];
            }
          }
        }
      } else {
        return rows as any[];
      }

      return [];
    } finally {
      await conn.close();
    }
  }

  private isFunctionCallSelect(sql: string): boolean {
    const s = sql.trim().toLowerCase();
    return s.startsWith("select") && s.endsWith("from dual");
  }
}
