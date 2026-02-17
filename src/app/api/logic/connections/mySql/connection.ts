/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectionMongo } from "../mongoDB/connection";
import mysql, {
  ConnectionOptions,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

const DB_TIMEOUT_MS = 20 * 60 * 1000;

type QueryRows =
  | RowDataPacket[]
  | RowDataPacket[][]
  | ResultSetHeader
  | ResultSetHeader[];

export class MySqlConnection extends ConnectionMongo {
  private connectionString: string;

  constructor(connectionString: string) {
    super();
    this.connectionString = connectionString;
  }

  private parseConnectionString(): ConnectionOptions {
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

    const host = dict["server"] ?? dict["host"] ?? "localhost";
    const port = Number(dict["port"] ?? 3306);
    const database = dict["database"] ?? dict["initial catalog"];
    const user = dict["user id"] ?? dict["uid"] ?? dict["user"];
    const password = dict["password"] ?? dict["pwd"] ?? "";

    if (!database) throw new Error("ConnectionString inválido: falta Database");
    if (!user) throw new Error("ConnectionString inválido: falta User ID");

    return {
      host,
      port,
      database,
      user,
      password,
      connectTimeout: DB_TIMEOUT_MS,
    };
  }

  public async select(query: string): Promise<any> {
    const config = this.parseConnectionString();
    const isCall = /^\s*call\s+/i.test(query);

    const conn = await mysql.createConnection({
      ...config,
    });

    try {
      if (isCall) {
        const [rows] = await conn.query<QueryRows>({
          sql: query,
          timeout: DB_TIMEOUT_MS,
        });
        if (Array.isArray(rows)) {
          // If multiple result sets are returned (RowDataPacket[][]), return the first result set.
          if (rows.length > 0 && Array.isArray(rows[0])) {
            return rows[0];
          }
          // Otherwise return the single-row/result array.
          return rows;
        }
        // Non-array result (e.g. ResultSetHeader)
        return rows;
      }

      const [rows] = await conn.query<QueryRows>({
        sql: query,
        timeout: DB_TIMEOUT_MS,
      });
      return rows;
    } finally {
      await conn.end();
    }
  }
}
