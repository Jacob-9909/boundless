"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import {
  consumeCode,
  endSession,
  getT,
  getUser,
  isAdmin,
  issueCode,
  markVerified,
  normalizeEmail,
  startSession,
  verifiedEmail,
} from "@/lib/auth";
import { q, track } from "@/lib/db";
import { isCountry, isRegion, isTopic, KINDS, POST_LANGS, REPORT_REASONS } from "@/lib/i18n";
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

/* ---------- sign in ---------- */

export async function sendCode(rawEmail: string): Promise<Result & { devCode?: string | null }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "이메일 주소를 확인해 주세요." };
  const code = await issueCode(email);
  if (!code) return { error: "코드를 너무 자주 요청했어요. 1분 뒤에 다시 시도해 주세요. 하루 10번까지 받을 수 있어요." };
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
  const rows = await q<{ id: string }>(
    `INSERT INTO boundless.users (email, nationality) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
    [email, nationality]
  );
  await startSession(rows[0].id);
  track("signup", rows[0].id);
  return { ok: true };
}

export async function signOut() {
  await endSession();
  redirect("/");
}

export async function setLang(lang: string) {
  if (lang !== "ko" && lang !== "en") return;
  (await cookies()).set("lang", lang, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
}

/* ---------- posts & comments ---------- */

type PostState = Result & { values?: Record<string, string> };

function readPost(f: FormData) {
  const values = {
    title: str(f, "title"),
    body: str(f, "body"),
    topic: str(f, "topic"),
    kind: str(f, "kind"),
    lang: str(f, "lang"),
    region: str(f, "region"),
  };
  const { title, body, topic, kind, lang, region } = values;
  let error: string | null = null;
  if (title.length < 2 || title.length > 120) error = "제목은 2~120자로 적어 주세요.";
  else if (body.length < 2 || body.length > 5000) error = "본문은 2~5000자로 적어 주세요.";
  else if (!isTopic(topic)) error = "주제를 골라 주세요.";
  else if (!KINDS.some((k) => k.id === kind)) error = "글 종류를 골라 주세요.";
  else if (!POST_LANGS.includes(lang)) error = "원문 언어를 골라 주세요.";
  else if (region && !isRegion(region)) error = "지역을 다시 골라 주세요.";
  return { values, error };
}

export async function createPost(_: PostState, f: FormData): Promise<PostState> {
  const user = await requireUser();
  const { values, error } = readPost(f);
  if (error) return { error, values };
  if ((await recentCount("posts", user.id)) >= 5) return { error: "글은 1시간에 5개까지 올릴 수 있어요.", values };
  const rows = await q<{ id: string }>(
    "INSERT INTO boundless.posts (user_id, topic, kind, lang, region, title, body) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    [user.id, values.topic, values.kind, values.lang, values.region || null, values.title, values.body]
  );
  track("post", user.id);
  redirect(`/posts/${rows[0].id}`);
}

export async function updatePost(postId: string, _: PostState, f: FormData): Promise<PostState> {
  const user = await requireUser();
  const { values, error } = readPost(f);
  if (error) return { error, values };
  await q(
    `UPDATE boundless.posts SET topic = $3, kind = $4, lang = $5, region = $6, title = $7, body = $8, updated_at = now()
     WHERE id = $1 AND user_id = $2`,
    [postId, user.id, values.topic, values.kind, values.lang, values.region || null, values.title, values.body]
  );
  redirect(`/posts/${postId}`);
}

export async function addComment(postId: string, _: Result, f: FormData): Promise<Result> {
  const user = await requireUser();
  const body = str(f, "body");
  const parent = str(f, "parent");
  if (body.length < 1 || body.length > 2000) return { error: "댓글은 1~2000자로 적어 주세요." };
  if ((await recentCount("comments", user.id)) >= 30) return { error: "댓글은 1시간에 30개까지 달 수 있어요." };
  // Anonymous handle inside this post: author = 0, everyone else numbered by their first comment.
  // Replies hang one level deep: replying to a reply attaches to its top-level comment.
  // ponytail: two brand-new commenters at the same instant could share a number; add a per-post lock if that shows up.
  const rows = await q(
    `INSERT INTO boundless.comments (post_id, user_id, body, anon_no, parent_id)
     SELECT p.id, $2, $3, CASE WHEN p.user_id = $2 THEN 0 ELSE COALESCE(
       (SELECT anon_no FROM boundless.comments WHERE post_id = p.id AND user_id = $2 LIMIT 1),
       (SELECT COALESCE(max(anon_no), 0) + 1 FROM boundless.comments WHERE post_id = p.id)) END,
       (SELECT COALESCE(pc.parent_id, pc.id) FROM boundless.comments pc WHERE pc.id = $4::bigint AND pc.post_id = p.id)
     FROM boundless.posts p WHERE p.id = $1 AND NOT p.hidden RETURNING id`,
    [postId, user.id, body, /^\d{1,18}$/.test(parent) ? parent : null]
  );
  if (!rows.length) return { error: "이 글에는 댓글을 달 수 없어요." };
  track("comment", user.id);
  refresh();
  return { ok: true };
}

/** 공감 / helpful toggle on a post or a comment. */
export async function toggleLike(f: FormData) {
  const user = await requireUser();
  const [table, col, id] = /^\d{1,18}$/.test(str(f, "comment"))
    ? ["comment_likes", "comment_id", str(f, "comment")]
    : ["post_likes", "post_id", str(f, "post")];
  if (!/^\d{1,18}$/.test(id)) return;
  const del = await q(`DELETE FROM boundless.${table} WHERE ${col} = $1 AND user_id = $2 RETURNING 1`, [id, user.id]);
  if (!del.length) await q(`INSERT INTO boundless.${table} (${col}, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, user.id]);
  refresh();
}

/** Save (scrap) a post to read later. */
export async function toggleSave(f: FormData) {
  const user = await requireUser();
  const id = str(f, "post");
  if (!/^\d{1,18}$/.test(id)) return;
  const del = await q("DELETE FROM boundless.saves WHERE post_id = $1 AND user_id = $2 RETURNING 1", [id, user.id]);
  if (!del.length) await q("INSERT INTO boundless.saves (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, user.id]);
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
  if (/^\d{1,18}$/.test(comment)) {
    await q("DELETE FROM boundless.comments WHERE id = $1 AND user_id = $2", [comment, user.id]);
    refresh();
    return;
  }
  if (/^\d{1,18}$/.test(post)) {
    await q("DELETE FROM boundless.posts WHERE id = $1 AND user_id = $2", [post, user.id]);
    redirect("/me");
  }
}

/* ---------- safety ---------- */

async function targetOwner(f: FormData) {
  const post = str(f, "post");
  const comment = str(f, "comment");
  if (/^\d{1,18}$/.test(comment)) {
    const r = await q<{ user_id: string }>("SELECT user_id FROM boundless.comments WHERE id = $1", [comment]);
    return r[0] ? { post: null, comment, owner: r[0].user_id } : null;
  }
  if (/^\d{1,18}$/.test(post)) {
    const r = await q<{ user_id: string }>("SELECT user_id FROM boundless.posts WHERE id = $1", [post]);
    return r[0] ? { post, comment: null, owner: r[0].user_id } : null;
  }
  return null;
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

export async function blockAuthor(f: FormData) {
  const user = await requireUser();
  const target = await targetOwner(f);
  if (target && target.owner !== user.id) {
    await q("INSERT INTO boundless.blocks (user_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user.id, target.owner]);
  }
  redirect("/");
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
  // ponytail: hard delete cascades to posts, comments, reports and blocks. Revisit when the retention policy (P04) lands.
  await q("DELETE FROM boundless.users WHERE id = $1", [user.id]);
  await endSession();
  redirect("/");
}

/* ---------- moderation ---------- */

export async function moderate(f: FormData) {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/");
  const id = str(f, "report");
  const action = str(f, "action");
  if (!/^\d{1,18}$/.test(id) || (action !== "hide" && action !== "dismiss")) return;
  const r = await q<{ post_id: string | null; comment_id: string | null }>(
    "SELECT post_id, comment_id FROM boundless.reports WHERE id = $1",
    [id]
  );
  if (!r[0]) return;
  const { post_id, comment_id } = r[0];
  if (action === "hide") {
    if (comment_id) await q("UPDATE boundless.comments SET hidden = true WHERE id = $1", [comment_id]);
    else await q("UPDATE boundless.posts SET hidden = true WHERE id = $1", [post_id]);
  }
  // Resolve every open report on the same target together.
  await q(
    `UPDATE boundless.reports SET status = $1, resolved_at = now()
     WHERE status = 'received' AND (CASE WHEN $2::bigint IS NOT NULL THEN comment_id = $2::bigint ELSE post_id = $3::bigint AND comment_id IS NULL END)`,
    [action === "hide" ? "actioned" : "dismissed", comment_id, post_id]
  );
  refresh();
}
