import Link from "next/link";
import { redirect } from "next/navigation";
import { moderate, resolveAppeal } from "@/app/actions";
import { NationalityChip, Notice, PageHead } from "@/components/ui";
import { canViewQueue, getT, getUser, isAdmin } from "@/lib/auth";
import { q } from "@/lib/db";
import { ALERTS, alertOf } from "@/lib/guide";
import { REPORT_REASONS, timeAgo } from "@/lib/i18n";

export const metadata = { title: "Moderation" };

type Open = {
  id: string;
  reason: string;
  details: string;
  created_at: Date;
  post_id: string;
  is_comment: boolean;
  excerpt: string;
  nationality: string;
  same: number;
};

export default async function AdminPage() {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!canViewQueue(user)) redirect("/feed");
  // The demo moderator (judges) sees the real queue, but cannot act on it.
  const readOnly = !isAdmin(user);

  const [open, events, appeals, flagged] = await Promise.all([
    q<Open>(
      `SELECT r.id, r.reason, r.details, r.created_at,
         COALESCE(r.post_id, c.post_id) AS post_id, r.comment_id IS NOT NULL AS is_comment,
         left(COALESCE(c.body, p.title || ' — ' || p.body), 160) AS excerpt,
         u.nationality,
         (SELECT count(*)::int FROM boundless.reports r2 WHERE r2.status = 'received'
            AND r2.post_id IS NOT DISTINCT FROM r.post_id AND r2.comment_id IS NOT DISTINCT FROM r.comment_id) AS same
       FROM boundless.reports r
       LEFT JOIN boundless.comments c ON c.id = r.comment_id
       LEFT JOIN boundless.posts p ON p.id = r.post_id
       JOIN boundless.users u ON u.id = COALESCE(c.user_id, p.user_id)
       WHERE r.status = 'received' ORDER BY r.created_at LIMIT 50`,
    ),
    q<{ name: string; n: number }>(
      "SELECT name, count(*)::int AS n FROM boundless.events WHERE created_at > now() - interval '7 days' GROUP BY name ORDER BY name",
    ),
    q<{ id: string; reason: string; created_at: Date; post_id: string; is_comment: boolean; excerpt: string; nationality: string }>(
      `SELECT a.id, a.reason, a.created_at, COALESCE(a.post_id, c.post_id) AS post_id, a.comment_id IS NOT NULL AS is_comment,
         left(COALESCE(c.body, p.title || ' — ' || p.body), 160) AS excerpt, u.nationality
       FROM boundless.appeals a
       LEFT JOIN boundless.comments c ON c.id = a.comment_id
       LEFT JOIN boundless.posts p ON p.id = a.post_id
       JOIN boundless.users u ON u.id = a.user_id
       WHERE a.status = 'received' ORDER BY a.created_at LIMIT 50`,
    ),
    // Posts the AI flagged when they were filed (src/lib/ai.ts): crises first, then the newest.
    q<{ id: string; alert: string; created_at: Date; excerpt: string; nationality: string }>(
      `SELECT p.id, p.alert, p.created_at, left(p.title || ' — ' || p.body, 160) AS excerpt, u.nationality
       FROM boundless.posts p JOIN boundless.users u ON u.id = p.user_id
       WHERE p.alert IS NOT NULL AND NOT p.hidden AND p.created_at > now() - interval '7 days'
       ORDER BY p.alert = ANY($1::text[]) DESC, p.created_at DESC LIMIT 30`,
      [ALERTS.filter((a) => a.crisis).map((a) => a.id)]
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="OPS · QUEUE" title={t("운영 큐")} desc={t("접수된 신고와 재심 요청을 오래된 순서로 보여 줘요.")} />
      {readOnly && (
        <p role="status" className="mx-4 mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("시연용 운영자 계정이에요. 신고 내용과 지표는 실제와 같지만 처리 버튼은 꺼져 있어요.")}
        </p>
      )}
      <div className="space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-ink/10 bg-white p-4 text-sm">
          <p className="font-bold">{t("최근 7일 이용 지표")}</p>
          <p className="mt-1 opacity-80">{events.length ? events.map((e) => `${e.name} ${e.n}`).join(" · ") : "—"}</p>
        </section>
        {flagged.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-extrabold">{t("AI 우선 확인 {n}건", { n: flagged.length })}</h2>
            <p className="mb-2 text-xs opacity-75">{t("최근 7일 동안 AI가 긴급·위기 신호를 읽은 글이에요. 글쓴이에게는 상담 번호가 안내됐어요.")}</p>
            <ul className="space-y-2">
              {flagged.map((f) => {
                const a = alertOf(f.alert);
                return (
                  <li key={f.id} className={`rounded-2xl border-l-4 bg-white p-4 text-sm ${a?.crisis ? "border-rose-500" : "border-amber-400"}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded px-2 py-0.5 font-bold ${a?.crisis ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900"}`}>
                        {a ? t(a.ko) : f.alert}
                      </span>
                      <NationalityChip code={f.nationality} lang={lang} />
                      <span className="ml-auto opacity-70">{timeAgo(f.created_at, lang)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap opacity-80">{f.excerpt}</p>
                    <Link href={`/posts/${f.id}`} className="mt-1 inline-flex h-8 items-center text-xs text-primary underline">
                      {t("원문 보기")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {appeals.length > 0 && (
          <section>
            <h2 className="mb-2 font-display text-lg font-extrabold">{t("재심 요청 {n}건", { n: appeals.length })}</h2>
            <ul className="space-y-3">
              {appeals.map((a) => (
                <li key={a.id} className="rounded-2xl border-l-4 border-primary bg-white p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-soft px-2 py-0.5 font-bold text-primary">{t("재심")}</span>
                    <span>{a.is_comment ? t("댓글") : t("글")}</span>
                    <NationalityChip code={a.nationality} lang={lang} />
                    <span className="ml-auto opacity-70">{timeAgo(a.created_at, lang)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap opacity-80">{a.excerpt}</p>
                  <p className="mt-2 rounded-xl bg-paper px-3 py-2">
                    <span className="font-bold">{t("작성자 사유")}</span> · {a.reason}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {(["restore", "uphold"] as const).map((action) => (
                      <form key={action} action={resolveAppeal}>
                        <input type="hidden" name="appeal" value={a.id} />
                        <input type="hidden" name="action" value={action} />
                        <button
                          disabled={readOnly}
                          className={`h-9 rounded-full px-4 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${action === "restore" ? "bg-primary text-paper" : "bg-soft"}`}
                        >
                          {action === "restore" ? t("복구하기") : t("가림 유지")}
                        </button>
                      </form>
                    ))}
                    <Link href={`/posts/${a.post_id}`} className="ml-auto inline-flex h-8 items-center text-xs text-primary underline">
                      {t("원문 보기")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {open.length === 0 && <Notice title={t("처리할 신고가 없어요")} />}
        <ul className="space-y-3">
          {open.map((r) => (
            <li key={r.id} className="rounded-2xl border-l-4 border-red-600 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-red-50 px-2 py-0.5 font-bold text-red-800">{t(REPORT_REASONS.find((x) => x.id === r.reason)?.ko ?? "기타")}</span>
                <span>{r.is_comment ? t("댓글") : t("글")}</span>
                <NationalityChip code={r.nationality} lang={lang} />
                {r.same > 1 && <span className="font-bold">×{r.same}</span>}
                <span className="ml-auto opacity-70">{timeAgo(r.created_at, lang)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{r.excerpt}</p>
              {r.details && <p className="mt-1 text-xs opacity-70">“{r.details}”</p>}
              <div className="mt-2 flex items-center gap-2">
                {(["hide", "dismiss"] as const).map((action) => (
                  <form key={action} action={moderate}>
                    <input type="hidden" name="report" value={r.id} />
                    <input type="hidden" name="action" value={action} />
                    <button
                      disabled={readOnly}
                      className={`h-9 rounded-full px-4 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${action === "hide" ? "bg-red-700 text-white" : "bg-soft"}`}
                    >
                      {action === "hide" ? t("가리기") : t("문제 없음")}
                    </button>
                  </form>
                ))}
                <Link href={`/posts/${r.post_id}`} className="ml-auto text-xs text-primary underline">
                  {t("원문 보기")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
