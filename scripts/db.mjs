// Applies SQL to DATABASE_URL. No psql needed.
//   node scripts/db.mjs db/migrations               every migration not applied yet, in file-name order
//   node scripts/db.mjs db/migrations db/seed.sql   then a plain SQL file (seed data, never in production)
// Each migration runs in one transaction and is recorded in boundless.schema_migrations by file name, so a
// failed file leaves nothing half-done and the next run retries it. Never rename or edit an applied file;
// add a new one. Forward only: see "스키마 변경" in docs/DEPLOY.md for changes that drop or rename things.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { sslFor } from "../src/lib/pg-ssl.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = new pg.Client({ connectionString: url, ssl: sslFor(url) });
// RAISE WARNING in a migration (e.g. 0004 when pg_trgm is missing) shows up in the deploy log.
client.on("notice", (n) => n.severity !== "NOTICE" && console.warn(`${n.severity}: ${n.message}`));
await client.connect();

async function migrate(dir) {
  // Two deploys at once would race on the same file; the second waits here.
  await client.query("SELECT pg_advisory_lock(hashtext('boundless.schema_migrations'))");
  // Same guard as 0001: on shared servers an admin creates the schema, so only create it when missing.
  await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'boundless') THEN CREATE SCHEMA boundless; END IF;
    END $$;
    CREATE TABLE IF NOT EXISTS boundless.schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await client.query("SELECT version FROM boundless.schema_migrations")).rows.map((r) => r.version));
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files.filter((f) => !done.has(f))) {
    await client.query("BEGIN");
    try {
      await client.query(readFileSync(join(dir, f), "utf8"));
      await client.query("INSERT INTO boundless.schema_migrations (version) VALUES ($1)", [f]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw new Error(`${f}: ${e.message}`);
    }
    console.log(`migrated ${f}`);
  }
  console.log(`schema up to date (${files.length} migrations)`);
}

try {
  for (const path of process.argv.slice(2)) {
    if (statSync(path).isDirectory()) await migrate(path);
    else {
      await client.query(readFileSync(path, "utf8"));
      console.log(`applied ${path}`);
    }
  }
} finally {
  await client.end();
}
