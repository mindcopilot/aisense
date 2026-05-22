/**
 * Database access layer.
 *
 * Connects to PostgreSQL when it is reachable. When it is not — e.g. a fresh
 * checkout with no Docker — it transparently falls back to an in-memory
 * Postgres (pg-mem) so the app is genuinely out-of-the-box runnable. Either
 * way the rest of the codebase only sees the `query()` helper.
 */
import pg from "pg";
import { config } from "../config.js";

let poolPromise: Promise<pg.Pool> | null = null;

/** True once the active pool is the in-memory fallback. */
export let usingInMemoryDb = false;

async function connectPostgres(): Promise<pg.Pool> {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 3_000,
  });
  const client = await pool.connect();
  client.release();
  pool.on("error", (err) => console.error("[db] pool error", err));
  return pool;
}

async function createInMemory(): Promise<pg.Pool> {
  const { newDb } = await import("pg-mem");
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  const { Pool } = mem.adapters.createPg();
  usingInMemoryDb = true;
  return new Pool() as unknown as pg.Pool;
}

async function createPool(): Promise<pg.Pool> {
  try {
    const pool = await connectPostgres();
    console.log("[db] connected to PostgreSQL");
    return pool;
  } catch {
    console.warn(
      "[db] PostgreSQL unreachable — using in-memory database (pg-mem). " +
        "Data resets on restart; start `docker compose up -d` for persistence.",
    );
    return createInMemory();
  }
}

export function getPool(): Promise<pg.Pool> {
  if (!poolPromise) poolPromise = createPool();
  return poolPromise;
}

/** Thin typed query helper used by every repository. */
export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = await getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function closePool(): Promise<void> {
  if (!poolPromise) return;
  const pool = await poolPromise;
  await pool.end();
}
