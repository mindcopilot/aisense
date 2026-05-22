/**
 * API server entry point — wires HTTP routing to the domain modules and
 * bootstraps the database so the app runs with zero manual setup.
 */
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initDatabase } from "./db/init.js";
import { closePool } from "./db/pool.js";
import { projectRoutes } from "./modules/projects/projectRoutes.js";
import { studioRoutes } from "./modules/studio/studioRoutes.js";
import { contentRoutes } from "./modules/content/contentRoutes.js";
import { marketingRoutes } from "./modules/marketing/marketingRoutes.js";
import { marketingService } from "./modules/marketing/marketingService.js";
import { errorMiddleware } from "./http/errorMiddleware.js";
import { shutdownObservability } from "./llm/observability.js";

async function main(): Promise<void> {
  await initDatabase();
  // Re-arm any in-process marketing schedules left active before a restart.
  await marketingService.resumeSchedules();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/projects", projectRoutes);
  app.use("/api/studio", studioRoutes);
  app.use("/api/content", contentRoutes);
  app.use("/api/marketing", marketingRoutes);
  app.use(errorMiddleware);

  const server = app.listen(config.port, () => {
    console.log(`[api] Looma API listening on :${config.port}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await Promise.allSettled([closePool(), shutdownObservability()]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[api] failed to start", err);
  process.exit(1);
});
