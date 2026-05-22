/**
 * Explicit migration entry point (`npm run db:migrate`).
 *
 * The API server also runs this automatically on startup; this script is for
 * provisioning a real PostgreSQL instance ahead of time.
 */
import { initDatabase } from "./init.js";
import { closePool } from "./pool.js";

initDatabase()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] failed", err);
    process.exit(1);
  });
