const WORKER_NAME = "omni-reports-worker";
const JOB_INTERVAL_MS = 5 * 60 * 1000;

let isRunning = false;

function log(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] [${WORKER_NAME}] ${message}`, error);
    return;
  }
  console.log(`[${timestamp}] [${WORKER_NAME}] ${message}`);
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
