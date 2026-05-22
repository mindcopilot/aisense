/**
 * Temporal worker process — polls the task queue and executes photoshoot
 * workflows + activities. Run separately from the API server:
 *   npm run dev:worker
 */
import { fileURLToPath } from "node:url";
import { Worker, NativeConnection } from "@temporalio/worker";
import { config } from "./config.js";
import { initDatabase } from "./db/init.js";
import * as activities from "./temporal/activities.js";

async function run(): Promise<void> {
  await initDatabase();

  const connection = await NativeConnection.connect({
    address: config.temporal.address,
  });

  const worker = await Worker.create({
    connection,
    namespace: config.temporal.namespace,
    taskQueue: config.temporal.taskQueue,
    // The Temporal worker bundles this entry itself and compiles TS, so the
    // source file is referenced directly (works under tsx in development).
    workflowsPath: fileURLToPath(new URL("./temporal/workflows.ts", import.meta.url)),
    activities,
  });

  console.log(`[worker] listening on task queue "${config.temporal.taskQueue}"`);
  await worker.run();
}

run().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
