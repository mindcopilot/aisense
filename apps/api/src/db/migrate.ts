/**
 * Applies schema.sql and seeds demo data so the app is usable on first run.
 * Run via `npm run db:migrate`.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool, closePool } from "./pool.js";
import { seedDemoData } from "./seed.js";

const here = dirname(fileURLToPath(import.meta.url));

async function migrate(): Promise<void> {
  const schema = await readFile(join(here, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("[migrate] schema applied");

  await seedDemoData();
  console.log("[migrate] demo data seeded");
}

migrate()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] failed", err);
    process.exit(1);
  });
