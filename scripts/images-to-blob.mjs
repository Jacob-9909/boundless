// One-off: moves photos still stored in Postgres (post_images.data) to the private Blob store, 50 at a time.
// Safe to stop and re-run: a row is switched to its Blob pathname only after the upload succeeded.
// Usage: DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... node scripts/images-to-blob.mjs
//   (vercel env pull gives both; the token is under the connected store's ".env.local" tab)
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
const local = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
const client = new pg.Client({ connectionString: url, ssl: !local });
await client.connect();

let moved = 0;
try {
  for (;;) {
    const { rows } = await client.query("SELECT id, post_id, mime, data FROM boundless.post_images WHERE blob IS NULL ORDER BY id LIMIT 50");
    if (!rows.length) break;
    for (const r of rows) {
      const { pathname } = await put(`posts/${r.post_id}/${randomUUID()}`, r.data, { access: "private", contentType: r.mime });
      await client.query("UPDATE boundless.post_images SET blob = $2, data = NULL WHERE id = $1 AND blob IS NULL", [r.id, pathname]);
      moved++;
    }
    console.log(`moved ${moved}`);
  }
} finally {
  await client.end();
}
console.log(`done: ${moved} photos now in Blob`);
