import { Pool } from "pg";

let pool: Pool | null = null;

export function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    // Local dev DBs (docker, PGlite) run without SSL.
    const isLocal = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
    pool = new Pool({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false }, max: 3 });
  }
  return pool;
}

export async function q<T extends object>(sql: string, params: unknown[] = []) {
  return (await db().query<T>(sql, params)).rows;
}

export function track(name: string, userId: string | null = null) {
  // ponytail: fire-and-forget event log; a failed insert must never break the user action.
  db()
    .query("INSERT INTO boundless.events (name, user_id) VALUES ($1, $2)", [name, userId])
    .catch(() => {});
}
