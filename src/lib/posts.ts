import { q } from "@/lib/db";

export type PostRow = {
  id: string;
  topic: string;
  kind: string;
  lang: string;
  region: string | null;
  title: string;
  body: string;
  hidden: boolean;
  solved: boolean;
  created_at: Date;
  updated_at: Date | null;
  nationality: string;
  comments: number;
  likes: number;
  liked: boolean;
  saved: boolean;
  mine: boolean;
};

export type CommentRow = {
  id: string;
  parent_id: string | null;
  anon_no: number;
  body: string;
  hidden: boolean;
  created_at: Date;
  nationality: string;
  likes: number;
  liked: boolean;
  mine: boolean;
};

// $1 is always the viewer's user id (or NULL for visitors).
const POST_COLS = `p.id, p.topic, p.kind, p.lang, p.region, p.title, p.body, p.hidden, p.solved, p.created_at, p.updated_at, u.nationality,
  (SELECT count(*)::int FROM boundless.comments c WHERE c.post_id = p.id AND NOT c.hidden) AS comments,
  (SELECT count(*)::int FROM boundless.post_likes l WHERE l.post_id = p.id) AS likes,
  EXISTS (SELECT 1 FROM boundless.post_likes l WHERE l.post_id = p.id AND l.user_id = $1::uuid) AS liked,
  EXISTS (SELECT 1 FROM boundless.saves s WHERE s.post_id = p.id AND s.user_id = $1::uuid) AS saved,
  (p.user_id = $1::uuid) IS TRUE AS mine`;
const FROM = "FROM boundless.posts p JOIN boundless.users u ON u.id = p.user_id";

// Content from accounts the viewer blocked is never shown to them.
const NOT_BLOCKED = (col: string) => `${col} NOT IN (SELECT blocked_id FROM boundless.blocks WHERE user_id = $1::uuid)`;

function likeEscape(s: string) {
  return `%${s.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
}

export const PAGE = 20;

export function listPosts(
  viewer: string | null,
  opts: { query?: string; topic?: string; nationality?: string; region?: string; before?: string; sort?: "new" | "likes"; limit?: number } = {}
) {
  const params: unknown[] = [viewer];
  const where = ["NOT p.hidden", NOT_BLOCKED("p.user_id")];
  const add = (sql: string, v: unknown) => {
    params.push(v);
    where.push(sql.replaceAll("?", `$${params.length}`));
  };
  if (opts.query) add("(p.title ILIKE ? OR p.body ILIKE ?)", likeEscape(opts.query));
  if (opts.topic) add("p.topic = ?", opts.topic);
  if (opts.nationality) add("u.nationality = ?", opts.nationality);
  if (opts.region) add("p.region = ?", opts.region);
  // Cursor for "load more": created_at of the last post on the previous page.
  if (opts.before && !Number.isNaN(Date.parse(opts.before))) add("p.created_at < ?::timestamptz", opts.before);
  params.push(opts.limit ?? PAGE);
  const order = opts.sort === "likes" ? "likes DESC, p.created_at DESC" : "p.created_at DESC";
  return q<PostRow>(`SELECT ${POST_COLS} ${FROM} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${params.length}`, params);
}

/** "HOT" board: most-liked posts of the last week. */
export function hotPosts(viewer: string | null) {
  // ponytail: threshold of 2 likes suits a small community; raise it as traffic grows.
  return q<PostRow>(
    `SELECT * FROM (SELECT ${POST_COLS} ${FROM}
       WHERE NOT p.hidden AND ${NOT_BLOCKED("p.user_id")} AND p.created_at > now() - interval '7 days') x
     WHERE likes >= 2 ORDER BY likes DESC, created_at DESC LIMIT 3`,
    [viewer]
  );
}

export function myPosts(viewer: string) {
  return q<PostRow>(`SELECT ${POST_COLS} ${FROM} WHERE p.user_id = $1 ORDER BY p.created_at DESC`, [viewer]);
}

export function savedPosts(viewer: string) {
  return q<PostRow>(
    `SELECT ${POST_COLS} ${FROM} JOIN boundless.saves s ON s.post_id = p.id AND s.user_id = $1
     WHERE NOT p.hidden ORDER BY s.created_at DESC`,
    [viewer]
  );
}

export async function getPost(viewer: string | null, id: string) {
  if (!/^\d{1,18}$/.test(id)) return null;
  const rows = await q<PostRow & { blocked: boolean }>(
    `SELECT ${POST_COLS}, (${NOT_BLOCKED("p.user_id")}) IS FALSE AS blocked ${FROM} WHERE p.id = $2`,
    [viewer, id]
  );
  return rows[0] ?? null;
}

export function getComments(viewer: string | null, postId: string) {
  return q<CommentRow>(
    `SELECT c.id, c.parent_id, c.anon_no, c.body, c.hidden, c.created_at, u.nationality,
       (SELECT count(*)::int FROM boundless.comment_likes l WHERE l.comment_id = c.id) AS likes,
       EXISTS (SELECT 1 FROM boundless.comment_likes l WHERE l.comment_id = c.id AND l.user_id = $1::uuid) AS liked,
       (c.user_id = $1::uuid) IS TRUE AS mine
     FROM boundless.comments c JOIN boundless.users u ON u.id = c.user_id
     WHERE c.post_id = $2 AND ${NOT_BLOCKED("c.user_id")} ORDER BY c.created_at`,
    [viewer, postId]
  );
}

/** Replies by others on my posts or under my comments, newer than `since`. */
export function newReplies(viewer: string, since: Date) {
  return q<{ id: string; post_id: string; title: string; body: string; anon_no: number; created_at: Date }>(
    `SELECT c.id, c.post_id, p.title, left(c.body, 120) AS body, c.anon_no, c.created_at
     FROM boundless.comments c JOIN boundless.posts p ON p.id = c.post_id
     LEFT JOIN boundless.comments parent ON parent.id = c.parent_id
     WHERE c.user_id <> $1 AND NOT c.hidden AND c.created_at > $2
       AND (p.user_id = $1 OR parent.user_id = $1)
     ORDER BY c.created_at DESC LIMIT 20`,
    [viewer, since]
  );
}

export async function unreadCount(viewer: string, since: Date) {
  const r = await q<{ n: number }>(
    `SELECT count(*)::int AS n FROM boundless.comments c JOIN boundless.posts p ON p.id = c.post_id
     LEFT JOIN boundless.comments parent ON parent.id = c.parent_id
     WHERE c.user_id <> $1 AND NOT c.hidden AND c.created_at > $2 AND (p.user_id = $1 OR parent.user_id = $1)`,
    [viewer, since]
  );
  return r[0].n;
}

/** Member count per nationality, for the "neighbors from N countries" strip. */
export function nationalityCounts() {
  return q<{ nationality: string; n: number }>(
    "SELECT nationality, count(*)::int AS n FROM boundless.users GROUP BY nationality ORDER BY n DESC, nationality"
  );
}
