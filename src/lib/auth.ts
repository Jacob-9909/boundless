import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { q } from "@/lib/db";
import { CULTURES } from "@/lib/cultures";
import { isLang, pickLang, toLang, type Lang } from "@/lib/i18n";
import { translator } from "@/lib/messages";

const SESSION = "bl_session";
const VERIFIED = "bl_verified"; // email proven by code, profile not created yet
const SESSION_DAYS = 30;

export type User = {
  id: string;
  email: string;
  nationality: string;
  nationality_changed_at: Date | null;
  region: string | null;
  seen_at: Date;
  read_lang: string | null;
  avatar: unknown; // Look (src/lib/avatar.ts) or null
  avatar_public: boolean;
};

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not configured");
  return s;
}

const hmac = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// token = base64url(value).expiresAtSeconds.signature
function seal(value: string, seconds: number) {
  const body = `${Buffer.from(value).toString("base64url")}.${Math.floor(Date.now() / 1000) + seconds}`;
  return `${body}.${hmac(body)}`;
}

function unseal(token: string | undefined): string | null {
  if (!token) return null;
  const [v, exp, sig] = token.split(".");
  if (!v || !exp || !sig || !safeEqual(sig, hmac(`${v}.${exp}`))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return Buffer.from(v, "base64url").toString();
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

export const getUser = cache(async (): Promise<User | null> => {
  const id = unseal((await cookies()).get(SESSION)?.value);
  if (!id) return null;
  const rows = await q<User>("SELECT id, email, nationality, nationality_changed_at, region, seen_at, read_lang, avatar, avatar_public FROM boundless.users WHERE id = $1", [id]);
  return rows[0] ?? null;
});

export async function startSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION, seal(userId, SESSION_DAYS * 86400), cookieOpts(SESSION_DAYS * 86400));
  jar.delete(VERIFIED);
}

export async function endSession() {
  (await cookies()).delete(SESSION);
}

export async function markVerified(email: string) {
  (await cookies()).set(VERIFIED, seal(email, 30 * 60), cookieOpts(30 * 60));
}

export async function verifiedEmail() {
  return unseal((await cookies()).get(VERIFIED)?.value);
}

export const isDemoEmail = (email: string) => process.env.DEMO_LOGIN === "1" && email.endsWith("@example.com");

/** One-click sample accounts for judges and demos (always on in development). */
export const demoEnabled = () => process.env.DEMO_LOGIN === "1" || process.env.NODE_ENV !== "production";
export const DEMO_MODERATOR = "moderator@example.com";

export function isAdmin(user: User | null) {
  // Demo accounts can be opened by anyone, so they never get moderation rights.
  if (!user || isDemoEmail(user.email)) return false;
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  return list.includes(user.email);
}

/** Real admins act on reports; the demo moderator may only look (read-only queue). */
export function canViewQueue(user: User | null) {
  return isAdmin(user) || (!!user && demoEnabled() && user.email === DEMO_MODERATOR);
}

export function normalizeEmail(raw: unknown) {
  const e = String(raw ?? "").trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

const codeHash = (email: string, code: string) => hmac(`code:${email}:${code}`);

/**
 * New 6-digit code, or null when one was issued under 60 seconds ago or 10 were issued in the last day.
 * With 5 tries per code that caps guessing at 50 tries per email per day.
 */
export async function issueCode(email: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const rows = await q(
    `INSERT INTO boundless.login_codes AS c (email, code_hash, expires_at) VALUES ($1, $2, now() + interval '10 minutes')
     ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, attempts = 0, created_at = now(), expires_at = EXCLUDED.expires_at,
       issued = CASE WHEN c.window_start < now() - interval '1 day' THEN 1 ELSE c.issued + 1 END,
       window_start = CASE WHEN c.window_start < now() - interval '1 day' THEN now() ELSE c.window_start END
     WHERE c.created_at < now() - interval '60 seconds' AND (c.window_start < now() - interval '1 day' OR c.issued < 10)
     RETURNING email`,
    [email, codeHash(email, code)]
  );
  return rows.length ? code : null;
}

/** True once per issued code. Five wrong tries burn the code. */
export async function consumeCode(email: string, code: string) {
  const rows = await q<{ code_hash: string }>(
    `UPDATE boundless.login_codes SET attempts = attempts + 1
     WHERE email = $1 AND expires_at > now() AND attempts < 5 RETURNING code_hash`,
    [email]
  );
  if (!rows[0] || !safeEqual(rows[0].code_hash, codeHash(email, code))) return false;
  await q("DELETE FROM boundless.login_codes WHERE email = $1", [email]);
  return true;
}

/** Interface language: the member's explicit pick, else their culture's language, else the browser's. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  if (isLang(v)) return v;
  const user = await getUser();
  const own = user && toLang(CULTURES.find((c) => c.code === user.nationality)?.langs[0]);
  return own || pickLang((await headers()).get("accept-language") ?? "");
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: translator(lang) };
}
