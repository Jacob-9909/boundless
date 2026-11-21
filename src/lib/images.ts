// Post photos. With a Vercel Blob store connected (BLOB_STORE_ID through OIDC, or BLOB_READ_WRITE_TOKEN) the files
// live there, private, and post_images keeps only the pathname. Without one they stay in Postgres (bytea), which
// is what local dev, CI and self-hosted servers use. /api/img serves both under the same visibility rules.
import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import { q } from "@/lib/db";

export type Upload = { mime: string; data: Buffer };

export const blobEnabled = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

export async function saveImages(postId: string, images: Upload[]) {
  for (const im of images) {
    if (!blobEnabled()) {
      await q("INSERT INTO boundless.post_images (post_id, mime, data) VALUES ($1, $2, $3)", [postId, im.mime, im.data]);
      continue;
    }
    const { pathname } = await put(`posts/${postId}/${randomUUID()}`, im.data, { access: "private", contentType: im.mime });
    try {
      await q("INSERT INTO boundless.post_images (post_id, mime, blob) VALUES ($1, $2, $3)", [postId, im.mime, pathname]);
    } catch (e) {
      // No row points at the file (e.g. the post was deleted meanwhile). If it cannot go now, the cleanup does it.
      await del(pathname).catch(() =>
        q("INSERT INTO boundless.blob_trash (pathname) VALUES ($1) ON CONFLICT DO NOTHING", [pathname]).catch(() => {})
      );
      throw e;
    }
  }
}

/** The photo's bytes, from Blob or from the row itself. */
export async function imageBody(row: { data: Buffer | null; blob: string | null }): Promise<BodyInit | null> {
  if (row.data) return new Uint8Array(row.data);
  if (!row.blob) return null;
  const file = await get(row.blob, { access: "private" });
  return file?.statusCode === 200 ? file.stream : null;
}

/**
 * Deletes the files of photo rows that are gone (queued in blob_trash by a trigger, so cascades count too).
 * Called after delete actions and by the daily cleanup; a failure leaves the queue for the next run.
 */
export async function purgeBlobs() {
  if (!blobEnabled()) return 0;
  const rows = await q<{ pathname: string }>("SELECT pathname FROM boundless.blob_trash ORDER BY created_at LIMIT 500");
  if (!rows.length) return 0;
  const paths = rows.map((r) => r.pathname);
  await del(paths);
  await q("DELETE FROM boundless.blob_trash WHERE pathname = ANY($1)", [paths]);
  return paths.length;
}
