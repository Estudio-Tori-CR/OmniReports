import Log from "@/app/models/Log";
import { Binnacle } from "@/app/models/binnacle";
import MainDal from "../logic/dal/mainDal";
import fs from "fs";
import path from "path";

class Logs {
  private dal: MainDal;

  constructor() {
    this.dal = new MainDal();
  }

  private async saveLogInDb(message: string, level: string): Promise<void> {
    // Simulate saving log to a database
    await this.dal.InsertLog(new Log({ message: message, type: level }));
  }

  private saveLogInFile(message: string, level: string): void {
    // Simulate saving log to a file
    const filePath = path.join(
      process.env.LOG_PATH ?? "./logs",
      `logs-${new Date().toISOString().split("T")[0]}.txt`,
    );
    fs.writeFile(
      filePath,
      `[${level.toUpperCase()}]: ${message}\n`,
      { flag: "a" },
      (err) => {
        if (err) {
          console.error("Error writing log to file:", err);
        }
      },
    );
  }

  public async log(
    message: string,
    level: "info" | "warning" | "error",
    sabeDbLog: boolean = true,
  ): Promise<void> {
    try {
      if (sabeDbLog) {
        await this.saveLogInDb(message, level);
      } else {
        await this.saveLogInFile(message, level);
      }
    } catch (error) {
      await Promise.all([
        this.saveLogInFile(error as string, "error"),
        this.saveLogInFile(message, level),
      ]);
    }
  }

  private getCallerFromStack(): string {
    const stackLines = (new Error().stack ?? "")
      .split("\n")
      .map((line) => line.trim());

    const caller = stackLines.find(
      (line) =>
        line.startsWith("at ") &&
        !line.includes("getCallerFromStack") &&
        !line.includes("Binnacle"),
    );

    return caller?.replace(/^at\s+/, "") ?? "unknown";
  }

  public async Binnacle(
    user: string,
    report: string,
    requestIP: string,
    source?: string,
  ) {
    try {
      const entry = new Binnacle({
        method: source?.trim() || this.getCallerFromStack(),
        report: report,
        user: user,
        requestIP,
      });
      await this.dal.InsertBinnacle(entry);
    } catch (err) {
      this.log(err as string, "error");
    }
  }
}

export default Logs;
