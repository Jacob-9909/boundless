import { ASKING_TAGS } from "@/lib/boards";
import { q } from "@/lib/db";

export type PostRow = {
  id: string;
  topic: string; // board id
  kind: string; // tag (말머리) id
  space: string; // 'global' or a country code
  lang: string;
  region: string | null;
  title: string;
  body: string;
  price: number | null;
  deal: string | null;
  place: string | null;
  starts_on: string | null;
  ends_on: string | null;
  hidden: boolean;
  solved: boolean;
  created_at: Date;
  updated_at: Date | null;
  nationality: string;
  points: number; // author's member points (for the level badge)
  comments: number;
  likes: number;
  liked: boolean;
  saved: boolean;
  mine: boolean;
  top_answer: { body: string; nationality: string; likes: number } | null;
};

export type CommentRow = {
  id: string;
  parent_id: string | null;
  anon_no: number;
  body: string;
  hidden: boolean;
  created_at: Date;
  nationality: string;
  points: number;
  likes: number;
  liked: boolean;
  mine: boolean;
};

const POINTS = (alias: string) => `(SELECT mp.posts + 2 * mp.answers + 3 * mp.helped FROM boundless.member_points mp WHERE mp.user_id = ${alias})`;
const ASKS = `p.kind = ANY('{${ASKING_TAGS.join(",")}}')`;

// $1 is always the viewer's user id (or NULL for visitors).
const POST_COLS = `p.id, p.topic, p.kind, p.space, p.lang, p.region, p.title, p.body, p.price, p.deal, p.place,
  to_char(p.starts_on, 'YYYY-MM-DD') AS starts_on, to_char(p.ends_on, 'YYYY-MM-DD') AS ends_on,
  p.hidden, p.solved, p.created_at, p.updated_at, u.nationality, ${POINTS("p.user_id")} AS points,
  (SELECT count(*)::int FROM boundless.comments c WHERE c.post_id = p.id AND NOT c.hidden) AS comments,
  (SELECT count(*)::int FROM boundless.post_likes l WHERE l.post_id = p.id) AS likes,
  EXISTS (SELECT 1 FROM boundless.post_likes l WHERE l.post_id = p.id AND l.user_id = $1::uuid) AS liked,
  EXISTS (SELECT 1 FROM boundless.saves s WHERE s.post_id = p.id AND s.user_id = $1::uuid) AS saved,
  (p.user_id = $1::uuid) IS TRUE AS mine,
  (SELECT json_build_object('body', left(a.body, 160), 'nationality', au.nationality, 'likes', a.likes)
     FROM (SELECT c.*, (SELECT count(*)::int FROM boundless.comment_likes l WHERE l.comment_id = c.id) AS likes
           FROM boundless.comments c WHERE c.post_id = p.id AND c.parent_id IS NULL AND NOT c.hidden AND c.user_id <> p.user_id
             AND c.user_id NOT IN (SELECT blocked_id FROM boundless.blocks WHERE user_id = $1::uuid)) a
     JOIN boundless.users au ON au.id = a.user_id
     ORDER BY a.likes DESC, a.created_at LIMIT 1) AS top_answer`;
const FROM = "FROM boundless.posts p JOIN boundless.users u ON u.id = p.user_id";

// Content from accounts the viewer blocked is never shown to them.
const NOT_BLOCKED = (col: string) => `${col} NOT IN (SELECT blocked_id FROM boundless.blocks WHERE user_id = $1::uuid)`;

function likeEscape(s: string) {
  return `%${s.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
}

export const PAGE = 20;

export function listPosts(
  viewer: string | null,
  opts: {
    space?: string; // default 'global'; a country lounge only for members of that nationality (checked by callers)
    board?: string;
    tag?: string;
    query?: string;
    nationality?: string;
    region?: string;
    before?: string;
    sort?: "new" | "likes";
    waiting?: boolean; // questions nobody has answered yet
    limit?: number;
  } = {}
) {
  const params: unknown[] = [viewer];
  const where = ["NOT p.hidden", NOT_BLOCKED("p.user_id")];
  const add = (sql: string, v: unknown) => {
    params.push(v);
    where.push(sql.replaceAll("?", `$${params.length}`));
  };
  add("p.space = ?", opts.space ?? "global");
  if (opts.board) add("p.topic = ?", opts.board);
  if (opts.tag) add("p.kind = ?", opts.tag);
  if (opts.query) add("(p.title ILIKE ? OR p.body ILIKE ?)", likeEscape(opts.query));
  if (opts.nationality) add("u.nationality = ?", opts.nationality);
  if (opts.region) add("p.region = ?", opts.region);
  if (opts.waiting) where.push(`${ASKS} AND NOT p.solved AND NOT EXISTS (SELECT 1 FROM boundless.comments c WHERE c.post_id = p.id AND NOT c.hidden)`);
  // Cursor for "load more": created_at of the last post on the previous page.
  if (opts.before && !Number.isNaN(Date.parse(opts.before))) add("p.created_at < ?::timestamptz", opts.before);
  params.push(opts.limit ?? PAGE);
  const order = opts.sort === "likes" ? "likes DESC, p.created_at DESC" : "p.created_at DESC";
  return q<PostRow>(`SELECT ${POST_COLS} ${FROM} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${params.length}`, params);
}

/** "HOT" board: most-liked public posts of the last week. */
export function hotPosts(viewer: string | null) {
  // ponytail: threshold of 2 likes suits a small community; raise it as traffic grows.
  return q<PostRow>(
    `SELECT * FROM (SELECT ${POST_COLS} ${FROM}
       WHERE NOT p.hidden AND p.space = 'global' AND ${NOT_BLOCKED("p.user_id")} AND p.created_at > now() - interval '7 days') x
     WHERE likes >= 2 ORDER BY likes DESC, created_at DESC LIMIT 4`,
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
    `SELECT c.id, c.parent_id, c.anon_no, c.body, c.hidden, c.created_at, u.nationality, ${POINTS("c.user_id")} AS points,
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

/** Headline numbers for the landing page. */
export async function communityStats() {
  const r = await q<{ countries: number; posts: number; answers: number; today: number; waiting: number }>(
    `SELECT (SELECT count(DISTINCT nationality)::int FROM boundless.users) AS countries,
            (SELECT count(*)::int FROM boundless.posts WHERE NOT hidden) AS posts,
            (SELECT count(*)::int FROM boundless.comments WHERE NOT hidden) AS answers,
            (SELECT count(*)::int FROM boundless.posts WHERE NOT hidden AND created_at > now() - interval '1 day') AS today,
            (SELECT count(*)::int FROM boundless.posts p WHERE NOT p.hidden AND p.space = 'global' AND ${ASKS} AND NOT p.solved
               AND NOT EXISTS (SELECT 1 FROM boundless.comments c WHERE c.post_id = p.id AND NOT c.hidden)) AS waiting`
  );
  return r[0];
}

/** Public posts per board, for the sidebar and board directory. */
export function boardCounts() {
  return q<{ topic: string; n: number; today: number }>(
    `SELECT topic, count(*)::int AS n, count(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today
     FROM boundless.posts WHERE NOT hidden AND space = 'global' GROUP BY topic`
  );
}

export async function loungeCount(space: string) {
  const r = await q<{ n: number }>("SELECT count(*)::int AS n FROM boundless.posts WHERE NOT hidden AND space = $1", [space]);
  return r[0].n;
}

/** Members who helped the most: answers on others' posts and helpful votes received. */
export function ranking(limit = 5) {
  return q<{ user_id: string; nationality: string; answers: number; helped: number; points: number }>(
    `SELECT user_id, nationality, answers, helped, posts + 2 * answers + 3 * helped AS points
     FROM boundless.member_points WHERE answers + helped > 0
     ORDER BY points DESC, helped DESC LIMIT $1`,
    [limit]
  );
}

export async function myPoints(userId: string) {
  const r = await q<{ posts: number; answers: number; helped: number; points: number; rank: number }>(
    `SELECT posts, answers, helped, points, rank FROM (
       SELECT user_id, posts, answers, helped, posts + 2 * answers + 3 * helped AS points,
              rank() OVER (ORDER BY posts + 2 * answers + 3 * helped DESC)::int AS rank
       FROM boundless.member_points) x WHERE user_id = $1`,
    [userId]
  );
  return r[0] ?? { posts: 0, answers: 0, helped: 0, points: 0, rank: 0 };
}

/** Latest public replies across the community, for the "recent activity" rail. */
export function recentActivity(viewer: string | null, limit = 5) {
  return q<{ id: string; post_id: string; title: string; body: string; nationality: string; created_at: Date }>(
    `SELECT c.id, c.post_id, p.title, left(c.body, 90) AS body, u.nationality, c.created_at
     FROM boundless.comments c JOIN boundless.users u ON u.id = c.user_id JOIN boundless.posts p ON p.id = c.post_id
     WHERE NOT c.hidden AND NOT p.hidden AND p.space = 'global' AND ${NOT_BLOCKED("c.user_id")} AND ${NOT_BLOCKED("p.user_id")}
     ORDER BY c.created_at DESC LIMIT $2`,
    [viewer, limit]
  );
}

/** Member count per nationality. */
export function nationalityCounts() {
  return q<{ nationality: string; n: number }>(
    "SELECT nationality, count(*)::int AS n FROM boundless.users GROUP BY nationality ORDER BY n DESC, nationality"
  );
}
