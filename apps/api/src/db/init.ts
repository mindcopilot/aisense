/**
 * Database bootstrap — applies the schema and seeds demo data.
 *
 * Idempotent and safe to call on every process start, which is what makes the
 * app out-of-the-box runnable: no manual migration step required.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getPool } from "./pool.js";
import { seedDemoData } from "./seed.js";

const here = dirname(fileURLToPath(import.meta.url));

let initPromise: Promise<void> | null = null;

async function runInit(): Promise<void> {
  const pool = await getPool();
  const schema = await readFile(join(here, "schema.sql"), "utf8");
  await pool.query(schema);
  await seedDemoData();
  console.log("[db] schema applied and demo data seeded");
}

/** Ensures the database is ready. De-duplicated across concurrent callers. */
export function initDatabase(): Promise<void> {
  if (!initPromise) initPromise = runInit();
  return initPromise;
}
