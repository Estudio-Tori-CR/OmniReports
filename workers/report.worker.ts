import { SignJWT } from "jose";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const WORKER_NAME = "omni-reports-worker";
const JOB_INTERVAL_MS = 5 * 60 * 1000;

const JWT_SECRET =
  process.env.WORKER_JWT_SECRET ?? process.env.JWT_SECRET ?? "";
const WORKER_API_BASE_URL =
  process.env.WORKER_API_BASE_URL ?? "http://localhost:3001";
const WORKER_JWT_EMAIL =
  process.env.WORKER_JWT_EMAIL ?? "worker@omnireports.local";
const WORKER_JWT_ROLE = process.env.WORKER_JWT_ROLE ?? "ADMIN";
const WORKER_JWT_EXPIRES_SECONDS = Number(
  process.env.WORKER_JWT_EXPIRES_SECONDS ?? "300",
);

type BaseResponse<T> = {
  isSuccess: boolean;
  message: string;
  body?: T;
};

type ScheduledReport = {
  _id?: string;
  name?: string;
};

let isRunning = false;

function log(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] [${WORKER_NAME}] ${message}`, error);
    return;
  }
  console.log(`[${timestamp}] [${WORKER_NAME}] ${message}`);
}

function toHHmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

async function createWorkerToken(): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error("JWT secret is not configured.");
  }

  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const payload = {
    sub: WORKER_JWT_EMAIL,
    email: WORKER_JWT_EMAIL,
    roles: [WORKER_JWT_ROLE],
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${WORKER_JWT_EXPIRES_SECONDS}s`)
    .sign(secretKey);
}

async function getReportsBySchedule(
  day: number,
  fromHour: string,
): Promise<BaseResponse<ScheduledReport[]>> {
  const token = await createWorkerToken();
  const endpoint = new URL("/api/reports/reportsSheduled", WORKER_API_BASE_URL);
  endpoint.searchParams.set("day", day.toString());
  endpoint.searchParams.set("hour", fromHour);

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data =
    ((await response.json()) as BaseResponse<ScheduledReport[]>) ??
    ({
      isSuccess: false,
      message: "Invalid API response.",
    } as BaseResponse<ScheduledReport[]>);

  if (!response.ok) {
    return {
      isSuccess: false,
      message: data.message || `HTTP ${response.status}`,
      body: data.body,
    };
  }

  return data;
}

async function SendReport(
  reportId: string,
): Promise<BaseResponse<null>> {
  const token = await createWorkerToken();
  const endpoint = new URL("/api/reports/reportsSheduled", WORKER_API_BASE_URL);
  endpoint.searchParams.set("reportId", reportId.toString());
  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data =
    ((await response.json()) as BaseResponse<null>) ??
    ({
      isSuccess: false,
      message: "Invalid API response.",
    } as BaseResponse<null>);

  if (!response.ok) {
    return {
      isSuccess: false,
      message: data.message || `HTTP ${response.status}`,
      body: data.body,
    };
  }

  return data;
}

async function executeJob(): Promise<void> {
  if (isRunning) {
    log("Job skipped because the previous execution is still running.");
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    log("Job started.");

    const weekDayIndex = new Date(startedAt).getDay();
    const fiveMinutesAgo = new Date(startedAt - 5 * 60 * 1000);
    const fromHour = toHHmm(fiveMinutesAgo);

    const response = await getReportsBySchedule(weekDayIndex, fromHour);
    if (!response.isSuccess) {
      log(`Unable to load scheduled reports: ${response.message}`);
      return;
    }

    const reports = response.body ?? [];
    log(`Scheduled reports found: ${reports.length}.`);

    const executionResults = await Promise.allSettled(
      reports.map(async (report) => {
        const reportId = report._id?.toString().trim();
        if (!reportId) {
          return {
            reportName: report.name ?? "unknown",
            isSuccess: false,
            message: "Missing report id.",
          };
        }

        const executionResponse = await SendReport(reportId);
        return {
          reportName: report.name ?? reportId,
          isSuccess: executionResponse.isSuccess,
          message: executionResponse.message,
        };
      }),
    );

    let executedCount = 0;
    for (const result of executionResults) {
      if (result.status === "fulfilled") {
        if (result.value.isSuccess) {
          executedCount += 1;
          log(`Report executed: ${result.value.reportName}.`);
        } else {
          log(
            `Report failed: ${result.value.reportName}. ${result.value.message}`,
          );
        }
      } else {
        log("Report execution failed unexpectedly.", result.reason);
      }
    }

    log(`Reports executed successfully: ${executedCount}/${reports.length}.`);

    log(`Job finished in ${Date.now() - startedAt}ms.`);
  } catch (error) {
    log("Error while executing job.", error);
  } finally {
    isRunning = false;
  }
}

function startWorker(): void {
  log(`Worker started. Interval: ${JOB_INTERVAL_MS / 1000}s.`);

  void executeJob();

  const timer = setInterval(() => {
    void executeJob();
  }, JOB_INTERVAL_MS);

  const shutdown = (signal: NodeJS.Signals) => {
    log(`Signal ${signal} received. Shutting down worker...`);
    clearInterval(timer);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startWorker();
