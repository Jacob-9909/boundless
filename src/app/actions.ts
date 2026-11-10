"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { refresh } from "next/cache";
import {
  consumeCode,
  endSession,
  getT,
  DEMO_MODERATOR,
  demoEnabled,
  getLang,
  getUser,
  isAdmin,
  isDemoEmail,
  issueCode,
  markVerified,
  normalizeEmail,
  startSession,
  verifiedEmail,
} from "@/lib/auth";
import { isId, q, track } from "@/lib/db";
import { aiEnabled, checkDraft, summarizeThread, type DraftCheck, type Summary } from "@/lib/ai";
import { ASKING_TAGS, BOARDS, boardOf, DEALS, isBoard, LOUNGE } from "@/lib/boards";
import { isCountry, isLang, isRegion, langName, POST_LANGS, READ_LANGS, readLangOf, REPORT_REASONS } from "@/lib/i18n";
import { isAbusive } from "@/lib/moderation";
import { stripPII } from "@/lib/pii";
import { BUMP_AFTER_H } from "@/lib/posts";
import { translateItem } from "@/lib/translate";
import { sendCodeMail } from "@/lib/mail";

// Errors are returned as Korean dictionary keys; the client translates them.
export type Result = { error?: string; ok?: boolean };

// NFC: the same Vietnamese/Korean text can arrive composed or decomposed; store one form so search matches.
const str = (f: FormData, k: string) => String(f.get(k) ?? "").normalize("NFC").trim();

// ponytail: per-hour caps against flooding; a shared rate limiter if abuse shows up across accounts.
async function recentCount(table: "posts" | "comments", userId: string) {
  const r = await q<{ n: number }>(
    `SELECT count(*)::int AS n FROM boundless.${table} WHERE user_id = $1 AND created_at > now() - interval '1 hour'`,
    [userId]
  );
  return r[0].n;
}

async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Find or create the member for an email; their nationality is kept if they already exist. */
async function upsertUser(email: string, nationality: string) {
  const rows = await q<{ id: string }>(
    `INSERT INTO boundless.users (email, nationality) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
    [email, nationality]
  );
  return rows[0].id;
}

/* ---------- sign in ---------- */

export async function sendCode(rawEmail: string): Promise<Result & { devCode?: string | null }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "이메일 주소를 확인해 주세요." };
  const code = await issueCode(email);
  if (!code) return { error: "코드를 너무 자주 요청했어요. 1분 뒤에 다시 시도해 주세요. 하루 10번까지 받을 수 있어요." };
  // Demo deployments: fictional @example.com accounts (reserved domain, nobody owns it) get the code on screen.
  if (isDemoEmail(email)) return { ok: true, devCode: code };
  try {
    const devCode = await sendCodeMail(email, code, (await getT()).t);
    return { ok: true, devCode };
  } catch (e) {
    console.error("[boundless] mail failed", e);
    return { error: "메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
}

export async function verifyCode(rawEmail: string, code: string): Promise<Result & { next?: "done" | "profile" }> {
  const email = normalizeEmail(rawEmail);
  if (!email || !/^\d{6}$/.test(code.trim())) return { error: "6자리 코드를 입력해 주세요." };
  if (!(await consumeCode(email, code.trim()))) return { error: "코드가 맞지 않거나 만료됐어요. 새 코드를 받아 주세요." };
  const rows = await q<{ id: string }>("SELECT id FROM boundless.users WHERE email = $1", [email]);
  if (rows[0]) {
    await startSession(rows[0].id);
    return { ok: true, next: "done" };
  }
  await markVerified(email);
  return { ok: true, next: "profile" };
}

export async function completeSignup(nationality: string, agreed: boolean): Promise<Result> {
  const email = await verifiedEmail();
  if (!email) return { error: "인증 시간이 지났어요. 처음부터 다시 시도해 주세요." };
  if (!isCountry(nationality)) return { error: "공개할 국적을 골라 주세요." };
  // ponytail: age floor fixed at 14 (Korean PIPA guardian-consent line) until the team confirms policy P01.
  if (!agreed) return { error: "만 14세 이상 확인과 커뮤니티 규칙 동의가 필요해요." };
  // Keep the language the person signed up in (the user test: an English reader got switched to Filipino).
  // The culture's language stays the default only where no language was ever picked, e.g. signing in on a new device.
  const lang = await getLang();
  const id = await upsertUser(email, nationality);
  await startSession(id);
  await setLang(lang);
  track("signup", id);
  return { ok: true };
}

/**
 * Judges and demos: enter as the sample neighbor from a country without email verification.
 * Sample accounts are fictional (@example.com) and can never moderate.
 */
export async function demoLogin(code: string) {
  if (!demoEnabled()) return;
  const mod = code === "MOD";
  const nationality = mod ? "KR" : code === "XX" ? "CA" : code;
  if (!isCountry(nationality)) return;
  const email = mod ? DEMO_MODERATOR : `${nationality.toLowerCase()}@example.com`;
  await startSession(await upsertUser(email, nationality));
  // Switching sample neighbors shows each country in its own language.
  (await cookies()).delete("lang");
  // Replace, not push: Back from the feed would land on the intro page, which sends members straight back to the feed.
  redirect(mod ? "/admin" : "/feed", RedirectType.replace);
}

export async function signOut() {
  await endSession();
  redirect("/");
}

export async function setLang(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set("lang", lang, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
}

/* ---------- posts & comments ---------- */

export type PostState = Result & { values?: Record<string, string> };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_IMAGES = 4;

/** JPEG, PNG, WebP or GIF, judged by the first bytes (the browser's declared type is only a guess). */
function sniff(b: Buffer) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.toString("latin1", 0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  if (/^GIF8[79]a$/.test(b.toString("latin1", 0, 6))) return "image/gif";
  return null;
}

/** Photos attached to the post form. The browser shrinks them first (forms.tsx), so 600 KB is generous. */
async function readImages(f: FormData) {
  const images: { mime: string; data: Buffer }[] = [];
  for (const v of f.getAll("images")) {
    if (!(v instanceof File) || v.size === 0) continue;
    if (v.size > 600_000) return { error: "사진은 한 장에 600KB까지 올릴 수 있어요." };
    const data = Buffer.from(await v.arrayBuffer());
    const mime = sniff(data);
    if (!mime) return { error: "사진은 JPG, PNG, WebP, GIF만 올릴 수 있어요." };
    images.push({ mime, data });
  }
  if (images.length > MAX_IMAGES) return { error: "사진은 4장까지 올릴 수 있어요." };
  return { images };
}

async function saveImages(postId: string, images: { mime: string; data: Buffer }[]) {
  for (const im of images) await q("INSERT INTO boundless.post_images (post_id, mime, data) VALUES ($1, $2, $3)", [postId, im.mime, im.data]);
}

function readPost(f: FormData) {
  const values = {
    board: str(f, "board"),
    kind: str(f, "kind"),
    title: str(f, "title"),
    body: str(f, "body"),
    lang: str(f, "lang"),
    region: str(f, "region"),
    price: str(f, "price"),
    place: str(f, "place"),
    starts_on: str(f, "starts_on"),
    ends_on: str(f, "ends_on"),
    space: str(f, "space"),
  };
  const v = values;
  const board = boardOf(v.board);
  const lounge = v.space === "lounge";
  let error: string | null = null;
  if (lounge ? v.board !== LOUNGE.id : !isBoard(v.board)) error = "게시판을 골라 주세요.";
  else if (!board.tags.some((t) => t.id === v.kind)) error = "말머리를 골라 주세요.";
  else if (v.title.length < 2 || v.title.length > 120) error = "제목은 2~120자로 적어 주세요.";
  else if (v.body.length < 2 || v.body.length > 5000) error = "본문은 2~5000자로 적어 주세요.";
  else if (!POST_LANGS.includes(v.lang)) error = "원문 언어를 골라 주세요.";
  else if (v.region && !isRegion(v.region)) error = "지역을 다시 골라 주세요.";
  else if (board.extra === "market" && v.kind !== "free" && !/^\d{1,9}$/.test(v.price.replace(/[,\s]/g, ""))) error = "가격을 숫자로 적어 주세요. 나눔이면 말머리를 '나눔'으로 바꿔 주세요.";
  else if (v.place.length > 80) error = "장소는 80자 이내로 적어 주세요.";
  else if ((v.starts_on && !DATE_RE.test(v.starts_on)) || (v.ends_on && !DATE_RE.test(v.ends_on))) error = "날짜를 다시 골라 주세요.";
  else if (v.starts_on && v.ends_on && v.ends_on < v.starts_on) error = "끝나는 날이 시작하는 날보다 빨라요.";
  else if (isAbusive(`${v.title}\n${v.body}\n${v.place}`)) error = "욕설이나 혐오 표현이 있어서 올릴 수 없어요. 표현을 고친 뒤 다시 올려 주세요.";
  const extra = {
    price: board.extra === "market" ? (v.kind === "free" ? 0 : Number(v.price.replace(/[,\s]/g, "")) || 0) : null,
    deal: board.extra === "market" ? "open" : null,
    place: v.place || null,
    starts_on: board.extra === "event" ? v.starts_on || null : null,
    ends_on: board.extra === "event" ? v.ends_on || null : null,
  };
  return { values, error, extra, lounge };
}

export async function createPost(_: PostState, f: FormData): Promise<PostState> {
  const user = await requireUser();
  const { values, error, extra, lounge } = readPost(f);
  if (error) return { error, values };
  const files = await readImages(f);
  if (files.error) return { error: files.error, values };
  if ((await recentCount("posts", user.id)) >= 5) return { error: "글은 1시간에 5개까지 올릴 수 있어요.", values };
  const rows = await q<{ id: string }>(
    `INSERT INTO boundless.posts (user_id, space, topic, kind, lang, region, title, body, price, deal, place, starts_on, ends_on)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
    [user.id, lounge ? user.nationality : "global", values.board, values.kind, values.lang, values.region || null, values.title, values.body,
     extra.price, extra.deal, extra.place, extra.starts_on, extra.ends_on]
  );
  await saveImages(rows[0].id, files.images!);
  track("post", user.id);
  redirect(`/posts/${rows[0].id}`);
}

export async function updatePost(postId: string, _: PostState, f: FormData): Promise<PostState> {
  const user = await requireUser();
  const { values, error, extra } = readPost(f);
  if (error) return { error, values };
  const files = await readImages(f);
  if (files.error) return { error: files.error, values };
  // Photos the author unticked go; new ones join the rest, four at most.
  const drop = f.getAll("drop_image").map(String).filter(isId);
  // Counts only the author's own post, so the error never reveals another post's photos.
  const kept = await q<{ n: number }>(
    `SELECT count(*)::int AS n FROM boundless.post_images i JOIN boundless.posts p ON p.id = i.post_id
     WHERE i.post_id = $1 AND p.user_id = $2 AND NOT (i.id = ANY($3::bigint[]))`,
    [postId, user.id, drop]
  );
  if (kept[0].n + files.images!.length > MAX_IMAGES) return { error: "사진은 4장까지 올릴 수 있어요.", values };
  // The space never changes on edit; the board stays inside the same space.
  const rows = await q(
    `UPDATE boundless.posts SET topic = $3, kind = $4, lang = $5, region = $6, title = $7, body = $8,
       price = $9, place = $10, starts_on = $11, ends_on = $12, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING id`,
    [postId, user.id, values.board, values.kind, values.lang, values.region || null, values.title, values.body,
     extra.price, extra.place, extra.starts_on, extra.ends_on]
  );
  if (rows.length) {
    await q("DELETE FROM boundless.post_images WHERE post_id = $1 AND id = ANY($2::bigint[])", [postId, drop]);
    await saveImages(postId, files.images!);
  }
  await q("DELETE FROM boundless.translations WHERE item = $1", [`p:${postId}`]);
  redirect(`/posts/${postId}`);
}

export async function addComment(postId: string, _: Result, f: FormData): Promise<Result> {
  const user = await requireUser();
  const body = str(f, "body");
  const parent = str(f, "parent");
  if (body.length < 1 || body.length > 2000) return { error: "댓글은 1~2000자로 적어 주세요." };
  if (isAbusive(body)) return { error: "욕설이나 혐오 표현이 있어서 올릴 수 없어요. 표현을 고친 뒤 다시 올려 주세요." };
  if ((await recentCount("comments", user.id)) >= 30) return { error: "댓글은 1시간에 30개까지 달 수 있어요." };
  // Anonymous handle inside this post: author = 0, everyone else numbered by their first comment.
  // Replies hang one level deep: replying to a reply attaches to its top-level comment.
  // Lounge posts accept replies only from members of that nationality.
  // ponytail: two brand-new commenters at the same instant could share a number; add a per-post lock if that shows up.
  const rows = await q(
    `INSERT INTO boundless.comments (post_id, user_id, body, anon_no, parent_id)
     SELECT p.id, $2, $3, CASE WHEN p.user_id = $2 THEN 0 ELSE COALESCE(
       (SELECT anon_no FROM boundless.comments WHERE post_id = p.id AND user_id = $2 LIMIT 1),
       (SELECT COALESCE(max(anon_no), 0) + 1 FROM boundless.comments WHERE post_id = p.id)) END,
       (SELECT COALESCE(pc.parent_id, pc.id) FROM boundless.comments pc WHERE pc.id = $4::bigint AND pc.post_id = p.id)
     FROM boundless.posts p
     WHERE p.id = $1 AND NOT p.hidden AND (p.space = 'global' OR p.space = $5)
     RETURNING id`,
    [postId, user.id, body, isId(parent) ? parent : null, user.nationality]
  );
  if (!rows.length) return { error: "이 글에는 댓글을 달 수 없어요." };
  track("comment", user.id);
  refresh();
  return { ok: true };
}

/** Marketplace owner: 판매중 → 예약중 → 거래완료. */
export async function setDeal(f: FormData) {
  const user = await requireUser();
  const deal = str(f, "deal");
  if (!DEALS.some((d) => d.id === deal)) return;
  await q("UPDATE boundless.posts SET deal = $3 WHERE id = $1 AND user_id = $2 AND price IS NOT NULL", [str(f, "post"), user.id, deal]);
  refresh();
}

/** Translate a post or comment into the viewer's reading language. */
export async function translate(kind: "p" | "c", id: string): Promise<{ title?: string | null; body?: string; error?: string }> {
  if (!isId(id)) return { error: "번역할 글을 찾지 못했어요." };
  const [user, lang] = await Promise.all([getUser(), getLang()]);
  const to = readLangOf(user, lang);
  const rows = await q<{ title: string | null; body: string; lang: string; space: string; hidden: boolean }>(
    kind === "p"
      ? "SELECT title, body, lang, space, hidden FROM boundless.posts WHERE id = $1"
      : `SELECT NULL AS title, c.body, 'other' AS lang, p.space, c.hidden OR p.hidden AS hidden
         FROM boundless.comments c JOIN boundless.posts p ON p.id = c.post_id WHERE c.id = $1`,
    [id]
  );
  const src = rows[0];
  if (!src || src.hidden || (src.space !== "global" && src.space !== user?.nationality)) return { error: "번역할 글을 찾지 못했어요." };
  const out = await translateItem(`${kind}:${id}`, { title: src.title ?? undefined, body: src.body, lang: src.lang }, to);
  return out ?? { error: "지금은 번역할 수 없어요. 잠시 뒤 다시 시도해 주세요." };
}

/* ---------- AI helpers (src/lib/ai.ts) ---------- */

export type SummaryView = Summary & { refs: { id: string; no: number }[] };

/**
 * The AI summary of a solved thread, in the reader's language. Cached per language until the post or its
 * answers change (basis = hash of the text sent). ponytail: one summary for everyone, so a reply from someone
 * the viewer blocked can still shape it; per-viewer summaries would cost one AI call per reader.
 */
export async function aiSummary(postId: string): Promise<SummaryView | null> {
  if (!isId(postId) || !aiEnabled()) return null;
  const [user, ui] = await Promise.all([getUser(), getLang()]);
  const lang = readLangOf(user, ui);
  const rows = await q<{ title: string; body: string; space: string; hidden: boolean; solved: boolean }>(
    "SELECT title, body, space, hidden, solved FROM boundless.posts WHERE id = $1",
    [postId]
  );
  const p = rows[0];
  if (!p || p.hidden || !p.solved || (p.space !== "global" && p.space !== user?.nationality)) return null;
  const cs = await q<{ id: string; anon_no: number; body: string; likes: number }>(
    `SELECT c.id, c.anon_no, c.body, (SELECT count(*)::int FROM boundless.comment_likes l WHERE l.comment_id = c.id) AS likes
     FROM boundless.comments c WHERE c.post_id = $1 AND NOT c.hidden ORDER BY c.created_at LIMIT 30`,
    [postId]
  );
  if (!cs.some((c) => c.anon_no !== 0)) return null;
  const post = { title: stripPII(p.title), body: stripPII(p.body).slice(0, 3000) };
  const lines = cs.map((c) => ({ text: stripPII(c.body).slice(0, 600), helpful: c.likes, author: c.anon_no === 0 }));
  const basis = createHash("sha256").update(JSON.stringify([post, lines])).digest("hex");
  const hit = await q<{ summary: Summary }>("SELECT summary FROM boundless.post_summaries WHERE post_id = $1 AND lang = $2 AND basis = $3", [
    postId,
    lang,
    basis,
  ]);
  let s: Summary | null = hit[0]?.summary ?? null;
  if (!s) {
    s = await summarizeThread(post, lines, langName(lang, "en"));
    if (!s) return null;
    await q(
      `INSERT INTO boundless.post_summaries (post_id, lang, basis, summary) VALUES ($1, $2, $3, $4)
       ON CONFLICT (post_id, lang) DO UPDATE SET basis = EXCLUDED.basis, summary = EXCLUDED.summary, created_at = now()`,
      [postId, lang, basis, JSON.stringify(s)]
    );
  }
  return { ...s, refs: s.sources.map((n) => ({ id: cs[n - 1].id, no: cs[n - 1].anon_no })) };
}

/** Before posting: a better board or title, missing details, privacy warnings. Never an answer. */
export async function aiCheckDraft(d: { title: string; body: string; board: string; space: string }): Promise<{ check?: DraftCheck; error?: string }> {
  const user = await requireUser();
  if (!aiEnabled()) return { error: "AI 점검을 지금은 쓸 수 없어요. 잠시 뒤 다시 시도해 주세요." };
  const title = String(d.title ?? "").normalize("NFC").trim().slice(0, 120);
  const body = String(d.body ?? "").normalize("NFC").trim().slice(0, 5000);
  if (body.length < 10) return { error: "본문을 조금 더 적은 뒤 점검해 주세요." };
  const used = await q<{ n: number }>(
    "SELECT count(*)::int AS n FROM boundless.events WHERE name = 'ai_check' AND user_id = $1 AND created_at > now() - interval '1 hour'",
    [user.id]
  );
  if (used[0].n >= 20) return { error: "AI 점검은 1시간에 20번까지 쓸 수 있어요." };
  track("ai_check", user.id);
  const global = d.space !== "lounge" && isBoard(d.board);
  const boards = global ? BOARDS.map((b) => ({ id: b.id, about: `${b.ko}. ${b.desc}` })) : [];
  const check = await checkDraft({ title: stripPII(title), body: stripPII(body), board: global ? d.board : "" }, boards, langName(await getLang(), "en"));
  return check ? { check } : { error: "AI 점검을 지금은 쓸 수 없어요. 잠시 뒤 다시 시도해 주세요." };
}

export async function setReadLang(f: FormData) {
  const user = await requireUser();
  const v = str(f, "read_lang");
  await q("UPDATE boundless.users SET read_lang = $2 WHERE id = $1", [user.id, READ_LANGS.includes(v) ? v : null]);
  refresh();
}

/** Remove the member's row if it exists, else add it (likes, saves and follows). */
async function toggleRow(table: "post_likes" | "comment_likes" | "saves" | "follows", col: "post_id" | "comment_id" | "followee_id", id: string, userId: string) {
  const del = await q(`DELETE FROM boundless.${table} WHERE ${col} = $1 AND user_id = $2 RETURNING 1`, [id, userId]);
  if (!del.length) await q(`INSERT INTO boundless.${table} (${col}, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, userId]);
}

/** 공감 / helpful toggle on a post or a comment. */
export async function toggleLike(f: FormData) {
  const user = await requireUser();
  const comment = str(f, "comment");
  const post = str(f, "post");
  if (isId(comment)) await toggleRow("comment_likes", "comment_id", comment, user.id);
  else if (isId(post)) await toggleRow("post_likes", "post_id", post, user.id);
  else return;
  refresh();
}

/** Save (scrap) a post to read later. */
export async function toggleSave(f: FormData) {
  const user = await requireUser();
  const id = str(f, "post");
  if (!isId(id)) return;
  await toggleRow("saves", "post_id", id, user.id);
  refresh();
}

/** One view each time the post page opens. Refreshes after a like or reply do not count (see ViewCount). */
export async function countView(id: string) {
  if (!isId(id)) return;
  const user = await getUser();
  // ponytail: no per-viewer dedupe; key views by viewer in a table if counts get gamed.
  await q("UPDATE boundless.posts SET views = views + 1 WHERE id = $1 AND NOT hidden AND user_id IS DISTINCT FROM $2::uuid", [id, user?.id ?? null]);
}

/** "Ask again" (like a 끌어올리기): the author lifts a question nobody answered back to the top of the lists. */
export async function bumpPost(f: FormData) {
  const user = await requireUser();
  const id = str(f, "post");
  if (!isId(id)) return;
  await q(
    `UPDATE boundless.posts p SET bumped_at = now()
     WHERE p.id = $1 AND p.user_id = $2 AND NOT p.hidden AND NOT p.solved AND p.kind = ANY($3::text[])
       AND COALESCE(p.bumped_at, p.created_at) < now() - make_interval(hours => $4)
       AND NOT EXISTS (SELECT 1 FROM boundless.comments c WHERE c.post_id = p.id AND NOT c.hidden)`,
    [id, user.id, ASKING_TAGS, BUMP_AFTER_H]
  );
  track("bump", user.id);
  refresh();
}

/** The author marks a question as solved (or reopens it). */
export async function toggleSolved(f: FormData) {
  const user = await requireUser();
  await q("UPDATE boundless.posts SET solved = NOT solved WHERE id = $1 AND user_id = $2", [str(f, "post"), user.id]);
  refresh();
}

/** Authors can always remove their own post (with its replies) or reply. */
export async function deleteOwn(f: FormData) {
  const user = await requireUser();
  const comment = str(f, "comment");
  const post = str(f, "post");
  if (isId(comment)) {
    // Cached translations go with the text (the comment and its replies).
    await q(
      `DELETE FROM boundless.translations WHERE item IN (
         SELECT 'c:' || c.id FROM boundless.comments c JOIN boundless.comments own ON own.id = $1 AND own.user_id = $2
         WHERE c.id = own.id OR c.parent_id = own.id)`,
      [comment, user.id]
    );
    // So does the AI summary that quoted it (made again on the next visit).
    await q("DELETE FROM boundless.post_summaries WHERE post_id = (SELECT post_id FROM boundless.comments WHERE id = $1 AND user_id = $2)", [comment, user.id]);
    await q("DELETE FROM boundless.comments WHERE id = $1 AND user_id = $2", [comment, user.id]);
    refresh();
    return;
  }
  if (isId(post)) {
    await q(
      `DELETE FROM boundless.translations WHERE item IN (
         SELECT 'p:' || id FROM boundless.posts WHERE id = $1 AND user_id = $2
         UNION SELECT 'c:' || c.id FROM boundless.comments c JOIN boundless.posts p ON p.id = c.post_id WHERE p.id = $1 AND p.user_id = $2)`,
      [post, user.id]
    );
    await q("DELETE FROM boundless.posts WHERE id = $1 AND user_id = $2", [post, user.id]);
    redirect("/me");
  }
}

/* ---------- safety ---------- */

/** The post or comment a safety form points at (a comment wins when both are sent), with its author. */
async function targetOwner(f: FormData) {
  const post = str(f, "post");
  const comment = str(f, "comment");
  if (isId(comment)) {
    const r = await q<{ user_id: string; hidden: boolean }>("SELECT user_id, hidden FROM boundless.comments WHERE id = $1", [comment]);
    return r[0] ? { post: null, comment, owner: r[0].user_id, hidden: r[0].hidden } : null;
  }
  if (isId(post)) {
    const r = await q<{ user_id: string; hidden: boolean }>("SELECT user_id, hidden FROM boundless.posts WHERE id = $1", [post]);
    return r[0] ? { post, comment: null, owner: r[0].user_id, hidden: r[0].hidden } : null;
  }
  return null;
}

/** Moderation hides or restores one target: a comment when there is one, else the post. */
async function setHidden(t: { post_id: string | null; comment_id: string | null }, hidden: boolean) {
  if (t.comment_id) await q("UPDATE boundless.comments SET hidden = $2 WHERE id = $1", [t.comment_id, hidden]);
  else await q("UPDATE boundless.posts SET hidden = $2 WHERE id = $1", [t.post_id, hidden]);
  // An AI summary may quote hidden text; it is made again from what stays visible.
  await q("DELETE FROM boundless.post_summaries WHERE post_id = COALESCE($1, (SELECT post_id FROM boundless.comments WHERE id = $2))", [t.post_id, t.comment_id]);
}

export async function reportContent(_: Result, f: FormData): Promise<Result> {
  const user = await requireUser();
  const target = await targetOwner(f);
  const reason = str(f, "reason");
  const details = str(f, "details").slice(0, 1000);
  if (!target) return { error: "신고할 글을 찾지 못했어요." };
  if (!REPORT_REASONS.some((r) => r.id === reason)) return { error: "신고 사유를 골라 주세요." };
  await q("INSERT INTO boundless.reports (reporter_id, post_id, comment_id, reason, details) VALUES ($1, $2, $3, $4, $5)", [
    user.id,
    target.post,
    target.comment,
    reason,
    details,
  ]);
  track("report", user.id);
  return { ok: true };
}

/** The author of a hidden post or comment asks once for a second look. */
export async function appeal(_: Result, f: FormData): Promise<Result> {
  const user = await requireUser();
  const target = await targetOwner(f);
  const reason = str(f, "reason");
  if (!target || target.owner !== user.id) return { error: "재심을 요청할 글을 찾지 못했어요." };
  if (reason.length < 10 || reason.length > 1000) return { error: "재심 사유를 10자 이상 적어 주세요." };
  if (!target.hidden) return { error: "가려진 글만 재심을 요청할 수 있어요." };
  await q("INSERT INTO boundless.appeals (user_id, post_id, comment_id, reason) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [
    user.id,
    target.post,
    target.comment,
    reason,
  ]);
  track("appeal", user.id);
  refresh();
  return { ok: true };
}

/** Moderator decision on an appeal: restore the content, or keep it hidden. */
export async function resolveAppeal(f: FormData) {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/feed");
  const id = str(f, "appeal");
  const action = str(f, "action");
  if (!isId(id) || (action !== "restore" && action !== "uphold")) return;
  const r = await q<{ post_id: string | null; comment_id: string | null }>(
    "UPDATE boundless.appeals SET status = $2, resolved_at = now() WHERE id = $1 AND status = 'received' RETURNING post_id, comment_id",
    [id, action === "restore" ? "restored" : "upheld"]
  );
  if (r[0] && action === "restore") await setHidden(r[0], false);
  refresh();
}

export async function blockAuthor(f: FormData) {
  const user = await requireUser();
  const target = await targetOwner(f);
  if (target && target.owner !== user.id) {
    await q("INSERT INTO boundless.blocks (user_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user.id, target.owner]);
  }
  // The feed says the block worked; a silent redirect left testers unsure.
  redirect("/feed?blocked=1");
}

/** Follow or unfollow the author of a post. The author only ever sees a follower count. */
export async function toggleFollow(f: FormData) {
  const user = await requireUser();
  const target = await targetOwner(f);
  if (!target || target.owner === user.id) return;
  await toggleRow("follows", "followee_id", target.owner, user.id);
  refresh();
}

/** Unfollow from the following list, by follow row (the list never holds member ids). */
export async function unfollow(f: FormData) {
  const user = await requireUser();
  const id = str(f, "follow");
  if (!isId(id)) return;
  await q("DELETE FROM boundless.follows WHERE id = $1 AND user_id = $2", [id, user.id]);
  refresh();
}

export async function unblockAll() {
  const user = await requireUser();
  await q("DELETE FROM boundless.blocks WHERE user_id = $1", [user.id]);
  refresh();
}

/* ---------- account ---------- */

export async function updateNationality(_: Result, f: FormData): Promise<Result> {
  const user = await requireUser();
  const code = str(f, "nationality");
  if (!isCountry(code)) return { error: "공개할 국적을 골라 주세요." };
  if (code === user.nationality) return { ok: true };
  // ponytail: self-service correction with a 30-day cooldown until policy P02 (correction exceptions) is decided.
  const rows = await q(
    `UPDATE boundless.users SET nationality = $2, nationality_changed_at = now()
     WHERE id = $1 AND (nationality_changed_at IS NULL OR nationality_changed_at < now() - interval '30 days') RETURNING id`,
    [user.id, code]
  );
  if (!rows.length) return { error: "국적은 30일에 한 번만 바꿀 수 있어요." };
  refresh();
  return { ok: true };
}

export async function setRegion(f: FormData) {
  const user = await requireUser();
  const region = str(f, "region");
  await q("UPDATE boundless.users SET region = $2 WHERE id = $1", [user.id, isRegion(region) ? region : null]);
  refresh();
}

export async function deleteAccount(f: FormData) {
  const user = await requireUser();
  if (f.get("confirm") !== "on") return;
  // Hard delete, as /policy promises: cascades to posts, comments, reports, appeals, blocks; cached
  // translations of that text are removed first. Usage events keep only an anonymous row (user_id SET NULL).
  await q(
    `DELETE FROM boundless.translations WHERE item IN (
       SELECT 'p:' || id FROM boundless.posts WHERE user_id = $1
       UNION SELECT 'c:' || c.id FROM boundless.comments c JOIN boundless.posts p ON p.id = c.post_id WHERE c.user_id = $1 OR p.user_id = $1)`,
    [user.id]
  );
  await q("DELETE FROM boundless.post_summaries WHERE post_id IN (SELECT post_id FROM boundless.comments WHERE user_id = $1)", [user.id]);
  await q("DELETE FROM boundless.users WHERE id = $1", [user.id]);
  await endSession();
  redirect("/");
}

/* ---------- moderation ---------- */

export async function moderate(f: FormData) {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/feed");
  const id = str(f, "report");
  const action = str(f, "action");
  if (!isId(id) || (action !== "hide" && action !== "dismiss")) return;
  const r = await q<{ post_id: string | null; comment_id: string | null }>(
    "SELECT post_id, comment_id FROM boundless.reports WHERE id = $1",
    [id]
  );
  if (!r[0]) return;
  const { post_id, comment_id } = r[0];
  if (action === "hide") await setHidden(r[0], true);
  // Resolve every open report on the same target together.
  await q(
    `UPDATE boundless.reports SET status = $1, resolved_at = now()
     WHERE status = 'received' AND (CASE WHEN $2::bigint IS NOT NULL THEN comment_id = $2::bigint ELSE post_id = $3::bigint AND comment_id IS NULL END)`,
    [action === "hide" ? "actioned" : "dismissed", comment_id, post_id]
  );
  refresh();
}
