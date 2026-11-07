// Runs SQL files against DATABASE_URL. No psql needed.
// Usage: node --env-file=.env.local scripts/db.mjs db/schema.sql [db/seed.sql]
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const local = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
const client = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
await client.connect();
for (const file of process.argv.slice(2)) {
  await client.query(readFileSync(file, "utf8"));
  console.log(`applied ${file}`);
}
await client.end();
