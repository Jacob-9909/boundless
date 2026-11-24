// The bell: what neighbors did with my posts and answers, read straight from the activity tables (no inbox table).
// users.seen_at is when I last opened the list; anything newer is unread.
import { q } from "../../lib/db";

export type NoteKind = "reply" | "like" | "helpful" | "accepted" | "following";
export type Note = {
  kind: NoteKind;
  post_id: string;
  comment_id: string | null;
  title: string;
  body: string | null;
  n: number; // how many neighbors, for grouped helpful marks
  anon_no: number | null; // replies: 0 = the post's author, else the neighbor's number on that post
  nationality: string | null;
  at: Date;
};

// $1 = me, $2 = only after this time. Blocked members' replies and new posts stay out, like everywhere else.
const NOTES = `
  SELECT 'reply' AS kind, c.post_id, c.id AS comment_id, p.title, left(c.body, 120) AS body, 1 AS n, c.anon_no, u.nationality, c.created_at AS at
    FROM boundless.comments c
    JOIN boundless.posts p ON p.id = c.post_id
    JOIN boundless.users u ON u.id = c.user_id
    LEFT JOIN boundless.comments parent ON parent.id = c.parent_id
   WHERE c.user_id <> $1 AND NOT c.hidden AND NOT p.hidden AND c.created_at > $2
     AND (p.user_id = $1 OR parent.user_id = $1)
     AND c.user_id NOT IN (SELECT blocked_id FROM boundless.blocks WHERE user_id = $1)
  UNION ALL
  SELECT 'like', p.id, NULL, p.title, NULL, count(*)::int, NULL, NULL, max(l.created_at)
    FROM boundless.post_likes l JOIN boundless.posts p ON p.id = l.post_id
   WHERE p.user_id = $1 AND l.user_id <> $1 AND l.created_at > $2
   GROUP BY p.id
  UNION ALL
  SELECT 'helpful', c.post_id, c.id, p.title, left(c.body, 120), count(*)::int, NULL, NULL, max(l.created_at)
    FROM boundless.comment_likes l
    JOIN boundless.comments c ON c.id = l.comment_id
    JOIN boundless.posts p ON p.id = c.post_id
   WHERE c.user_id = $1 AND l.user_id <> $1 AND l.created_at > $2 AND NOT c.hidden AND NOT p.hidden
   GROUP BY c.id, p.title
  UNION ALL
  SELECT 'accepted', p.id, c.id, p.title, left(c.body, 120), 1, NULL, NULL, p.accepted_at
    FROM boundless.posts p JOIN boundless.comments c ON c.id = p.accepted_comment_id
   WHERE c.user_id = $1 AND p.user_id <> $1 AND p.accepted_at > $2 AND NOT p.hidden
  UNION ALL
  -- New posts by neighbors I follow, in the shared square only (a lounge is for one nationality).
  SELECT 'following', p.id, NULL, p.title, left(p.body, 120), 1, NULL, u.nationality, p.created_at
    FROM boundless.follows f
    JOIN boundless.posts p ON p.user_id = f.followee_id
    JOIN boundless.users u ON u.id = p.user_id
   WHERE f.user_id = $1 AND NOT p.hidden AND p.space = 'global' AND p.created_at > greatest($2, f.created_at)
     AND p.user_id NOT IN (SELECT blocked_id FROM boundless.blocks WHERE user_id = $1)`;

/** The last 30 days, newest first. ponytail: one UNION over indexed foreign keys; add an inbox table if it gets slow. */
export function notes(viewer: string) {
  return q<Note>(`SELECT * FROM (${NOTES}) n ORDER BY at DESC LIMIT 50`, [viewer, new Date(Date.now() - 30 * 864e5)]);
}

/** The bell's number: notes newer than the last time the list was opened. */
export async function unreadNotes(viewer: string, since: Date) {
  const r = await q<{ n: number }>(`SELECT count(*)::int AS n FROM (${NOTES}) n`, [viewer, since]);
  return r[0].n;
}

export async function markNotesRead(viewer: string) {
  await q("UPDATE boundless.users SET seen_at = now() WHERE id = $1", [viewer]);
}
