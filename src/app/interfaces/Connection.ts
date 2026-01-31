import { ConnectionOptions } from "mysql2";

export default interface Connection {
  parseConnectionString(): ConnectionOptions;
  select(query: string): void;
}
