import Log from "@/app/models/Log";
import MainDal from "../logic/dal/mainDal";
import fs from "fs";
import path from "path";

class Logs {
  private dal: MainDal;

  constructor() {
    this.dal = new MainDal();
  }

  private saveLogInDb(message: string, level: string): void {
    // Simulate saving log to a database
    this.dal.InsertLog(new Log({ message: message, type: level }));
  }

  private saveLogInFile(message: string, level: string): void {
    // Simulate saving log to a file
    const filePath = path.join(
      process.cwd(),
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
}

export default Logs;
