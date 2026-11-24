import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { q } from "@/lib/db";
import { CULTURES } from "@/features/culture/cultures";
import { isLang, pickLang, toLang, type Lang } from "@/features/i18n/i18n";
import { translator } from "@/features/i18n/messages";

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
  avatar: unknown; // Look (src/features/avatar/avatar.ts) or null
  avatar_public: boolean;
  role: Role;
  session_version: number;
};

export type Role = "member" | "moderator" | "admin";

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

// The session cookie holds "<user id>:<session_version>". Cookies from before versions existed hold only the id
// and count as version 0, so the change signed nobody out.
export const getUser = cache(async (): Promise<User | null> => {
  const [id, version = "0"] = unseal((await cookies()).get(SESSION)?.value)?.split(":") ?? [];
  if (!id) return null;
  const rows = await q<User>(
    "SELECT id, email, nationality, nationality_changed_at, region, seen_at, read_lang, avatar, avatar_public, role, session_version FROM boundless.users WHERE id = $1",
    [id]
  );
  return rows[0] && String(rows[0].session_version) === version ? rows[0] : null;
});

export async function startSession(userId: string) {
  const rows = await q<{ session_version: number }>("SELECT session_version FROM boundless.users WHERE id = $1", [userId]);
  const jar = await cookies();
  jar.set(SESSION, seal(`${userId}:${rows[0].session_version}`, SESSION_DAYS * 86400), cookieOpts(SESSION_DAYS * 86400));
  jar.delete(VERIFIED);
}

export async function endSession() {
  (await cookies()).delete(SESSION);
}

/** Signs the member out on every device: each cookie issued before now carries a stale version. */
export async function endEverySession(userId: string) {
  await q("UPDATE boundless.users SET session_version = session_version + 1 WHERE id = $1", [userId]);
  await endSession();
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
/** A country's one-click sample account (demoLogin makes "<country code>@example.com"), not a seeded or test member. */
export const isSampleEmail = (email: string) => /^[a-z]{2}@example\.com$/.test(email);

/** ADMIN_EMAILS: admins by configuration, which is how the first admin exists before anyone can grant a role. */
export const envAdmins = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

// Demo accounts can be opened by anyone, so they never get staff rights, whatever their row says.
const staff = (user: User | null): user is User => !!user && !isDemoEmail(user.email);

/** Admins moderate and also grant or remove staff roles (/admin). */
export function isAdmin(user: User | null) {
  return staff(user) && (user.role === "admin" || envAdmins().includes(user.email));
}

/** Moderators act on reports and appeals. */
export function canModerate(user: User | null) {
  return isAdmin(user) || (staff(user) && user.role === "moderator");
}

/** Staff act on the queue; the demo moderator may only look (read-only queue). */
export function canViewQueue(user: User | null) {
  return canModerate(user) || (!!user && demoEnabled() && user.email === DEMO_MODERATOR);
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

/**
 * Per network: at most 20 code requests an hour, so one client cannot mail many addresses or use up the Gmail
 * sending quota (which would stop every sign-in). The address is kept only as a keyed hash, in the events log.
 */
export async function allowCodeRequest() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const name = `code:${hmac(`ip:${ip}`).slice(0, 16)}`;
  const r = await q<{ n: number }>("SELECT count(*)::int AS n FROM boundless.events WHERE name = $1 AND created_at > now() - interval '1 hour'", [name]);
  if (r[0].n >= 20) return false;
  await q("INSERT INTO boundless.events (name) VALUES ($1)", [name]);
  return true;
}

/** The mail never went out: expire the code and lift the 60-second wait so the person can ask again at once. */
export async function voidCode(email: string) {
  await q("UPDATE boundless.login_codes SET expires_at = now(), created_at = now() - interval '61 seconds' WHERE email = $1", [email]);
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
