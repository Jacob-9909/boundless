// Numbers for the moderator dashboard (/admin): the whole service at a glance, read straight from the tables.
// ponytail: plain aggregate queries on every visit; cache or roll them up if the tables get large.
import { ASKING_TAGS } from "@/lib/boards";
import { q } from "@/lib/db";

const n = (v: unknown) => Number(v ?? 0);

export async function adminStats() {
  const [[totals], daily, boards, nations, [answer], reports, alerts, [ai], events] = await Promise.all([
    q<Record<string, number>>(
      `SELECT
         (SELECT count(*)::int FROM boundless.users) AS members,
         (SELECT count(*)::int FROM boundless.users WHERE created_at > now() - interval '7 days') AS members_7d,
         (SELECT count(*)::int FROM boundless.posts WHERE NOT hidden) AS posts,
         (SELECT count(*)::int FROM boundless.posts WHERE NOT hidden AND created_at > now() - interval '7 days') AS posts_7d,
         (SELECT count(*)::int FROM boundless.comments WHERE NOT hidden) AS answers,
         (SELECT count(*)::int FROM boundless.comments WHERE NOT hidden AND created_at > now() - interval '7 days') AS answers_7d,
         (SELECT count(DISTINCT user_id)::int FROM (
            SELECT user_id FROM boundless.posts WHERE created_at > now() - interval '7 days'
            UNION ALL SELECT user_id FROM boundless.comments WHERE created_at > now() - interval '7 days') a) AS active_7d,
         (SELECT count(*)::int FROM boundless.posts WHERE hidden) AS hidden,
         (SELECT count(*)::int FROM boundless.appeals WHERE status = 'received') AS appeals_open,
         (SELECT count(*)::int FROM boundless.posts WHERE created_at > now() - interval '7 days' AND NOT hidden AND kind = ANY($1)) AS asked_7d,
         (SELECT count(*)::int FROM boundless.posts WHERE created_at > now() - interval '7 days' AND NOT hidden AND kind = ANY($1) AND solved) AS solved_7d,
         (SELECT count(*)::int FROM boundless.posts WHERE created_at > now() - interval '7 days' AND NOT hidden AND kind = ANY($1) AND accepted_comment_id IS NOT NULL) AS accepted_7d`,
      [ASKING_TAGS]
    ),
    // The last 14 days, oldest first, with empty days kept so the bars line up with the calendar.
    q<{ day: Date; posts: number; answers: number; signups: number }>(
      `SELECT d AS day,
         (SELECT count(*)::int FROM boundless.posts p WHERE p.created_at >= d AND p.created_at < d + interval '1 day') AS posts,
         (SELECT count(*)::int FROM boundless.comments c WHERE c.created_at >= d AND c.created_at < d + interval '1 day') AS answers,
         (SELECT count(*)::int FROM boundless.users u WHERE u.created_at >= d AND u.created_at < d + interval '1 day') AS signups
       FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') d
       ORDER BY d`
    ),
    q<{ topic: string; n: number }>(
      `SELECT topic, count(*)::int AS n FROM boundless.posts
       WHERE NOT hidden AND space = 'global' AND created_at > now() - interval '30 days' GROUP BY topic ORDER BY n DESC`
    ),
    q<{ nationality: string; n: number }>("SELECT nationality, count(*)::int AS n FROM boundless.users GROUP BY nationality ORDER BY n DESC, nationality LIMIT 8"),
    // Questions of the last 30 days: how many got an answer from someone else, and the median wait for the first one.
    q<{ median: number | null; answered: number; asked: number }>(
      `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY mins) AS median, count(mins)::int AS answered, count(*)::int AS asked
       FROM (SELECT (SELECT extract(epoch FROM min(c.created_at) - p.created_at) / 60 FROM boundless.comments c
                     WHERE c.post_id = p.id AND c.user_id <> p.user_id AND NOT c.hidden) AS mins
             FROM boundless.posts p WHERE p.kind = ANY($1) AND NOT p.hidden AND p.created_at > now() - interval '30 days') x`,
      [ASKING_TAGS]
    ),
    q<{ status: string; n: number }>("SELECT status, count(*)::int AS n FROM boundless.reports WHERE created_at > now() - interval '30 days' GROUP BY status"),
    q<{ alert: string; n: number }>(
      "SELECT alert, count(*)::int AS n FROM boundless.posts WHERE alert IS NOT NULL AND created_at > now() - interval '30 days' GROUP BY alert ORDER BY n DESC"
    ),
    q<{ summaries: number; translations: number }>(
      "SELECT (SELECT count(*)::int FROM boundless.post_summaries) AS summaries, (SELECT count(*)::int FROM boundless.translations) AS translations"
    ),
    // Usage events of the last week. Sign-in code requests (per-network keys) and AI alert counts are shown elsewhere.
    q<{ name: string; n: number }>(
      `SELECT name, count(*)::int AS n FROM boundless.events
       WHERE created_at > now() - interval '7 days' AND name NOT LIKE 'code:%' AND name NOT LIKE 'alert\\_%'
       GROUP BY name ORDER BY n DESC`
    ),
  ]);
  const status = Object.fromEntries(reports.map((r) => [r.status, r.n]));
  return {
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, n(v)])) as Record<string, number>,
    daily: daily.map((d) => ({ day: new Date(d.day), posts: n(d.posts), answers: n(d.answers), signups: n(d.signups) })),
    boards,
    nations,
    answer: { median: answer.median === null ? null : n(answer.median), answered: n(answer.answered), asked: n(answer.asked) },
    reports: { received: n(status.received), actioned: n(status.actioned), dismissed: n(status.dismissed) },
    alerts,
    ai: { summaries: n(ai.summaries), translations: n(ai.translations) },
    events,
  };
}
