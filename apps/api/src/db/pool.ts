/**
 * PostgreSQL connection pool.
 *
 * The single point of contact with the database driver. Repositories receive
 * the pool (or a client) and never import `pg` directly — keeps the driver
 * swappable and the data layer testable.
 */
import pg from "pg";
import { config } from "../config.js";

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[db] unexpected pool error", err);
});

/** Thin typed query helper. */
export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
