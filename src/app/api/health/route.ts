import { q } from "@/lib/db";

export async function GET() {
  await q("SELECT 1");
  return Response.json({ ok: true, build: process.env.APP_BUILD });
}
