/**
 * API server entry point — wires HTTP routing to the domain modules.
 */
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { projectRoutes } from "./modules/projects/projectRoutes.js";
import { studioRoutes } from "./modules/studio/studioRoutes.js";
import { errorMiddleware } from "./http/errorMiddleware.js";
import { closePool } from "./db/pool.js";
import { shutdownObservability } from "./llm/observability.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/projects", projectRoutes);
app.use("/api/studio", studioRoutes);
app.use(errorMiddleware);

const server = app.listen(config.port, () => {
  console.log(`[api] Looma API listening on :${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await Promise.allSettled([closePool(), shutdownObservability()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
