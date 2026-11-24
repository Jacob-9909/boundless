import { q } from "@/lib/db";
import { purgeBlobs } from "@/features/posts/images";

/**
 * Daily housekeeping (vercel.json crons; any scheduler can call it with the same header):
 * - rate-limit rows (code:*) older than 2 days: the limit only looks back one hour
 * - usage events older than 400 days: the dashboard shows weeks, /policy promises a year
 * - expired sign-in codes
 * - Blob files of deleted photos the delete actions did not get to
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET the route refuses everyone.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  const [codes, events, logins] = await Promise.all([
    q("DELETE FROM boundless.events WHERE name LIKE 'code:%' AND created_at < now() - interval '2 days' RETURNING 1"),
    q("DELETE FROM boundless.events WHERE name NOT LIKE 'code:%' AND created_at < now() - interval '400 days' RETURNING 1"),
    q("DELETE FROM boundless.login_codes WHERE expires_at < now() - interval '1 day' RETURNING 1"),
  ]);
  const blobs = await purgeBlobs();
  return Response.json({ codes: codes.length, events: events.length, logins: logins.length, blobs });
}
