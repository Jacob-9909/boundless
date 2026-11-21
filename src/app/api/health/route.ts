import { q } from "@/lib/db";
import { reportError } from "@/lib/log";

/** Uptime checks (.github/workflows/uptime.yml, deploy scripts): 200 when the app can reach the database, else 503. */
export async function GET() {
  const started = Date.now();
  try {
    await q("SELECT 1");
  } catch (e) {
    await reportError("health", e);
    return Response.json({ ok: false, build: process.env.APP_BUILD }, { status: 503 });
  }
  return Response.json({ ok: true, build: process.env.APP_BUILD, db_ms: Date.now() - started });
}
