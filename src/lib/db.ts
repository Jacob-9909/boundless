import { Pool } from "pg";
import { sslFor } from "./pg-ssl";

let pool: Pool | null = null;

export function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    pool = new Pool({ connectionString: url, ssl: sslFor(url), max: 3 });
  }
  return pool;
}

/** Row ids are bigint serials; anything else from a form or URL is rejected before it reaches SQL. */
export const isId = (s: string) => /^\d{1,18}$/.test(s);

export async function q<T extends object>(sql: string, params: unknown[] = []) {
  return (await db().query<T>(sql, params)).rows;
}

export type Query = typeof q;

/** Runs fn on one connection inside one transaction: what it writes commits together or not at all. */
export async function tx<R>(fn: (run: Query) => Promise<R>): Promise<R> {
  const client = await db().connect();
  const run: Query = async <T extends object>(sql: string, params: unknown[] = []) => (await client.query<T>(sql, params)).rows;
  try {
    await client.query("BEGIN");
    const result = await fn(run);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export function track(name: string, userId: string | null = null) {
  // ponytail: fire-and-forget event log; a failed insert must never break the user action.
  db()
    .query("INSERT INTO boundless.events (name, user_id) VALUES ($1, $2)", [name, userId])
    .catch(() => {});
}
