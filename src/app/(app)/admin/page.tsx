import { redirect } from "next/navigation";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { moderate, resolveAppeal } from "@/app/actions";
import { Icon } from "@/components/Icon";
import { NationalityChip, Notice, PageHead } from "@/components/ui";
import { canViewQueue, getT, getUser, isAdmin } from "@/lib/auth";
import { q } from "@/lib/db";
import { ALERTS, alertOf } from "@/lib/guide";
import { ASKING_TAGS } from "@/lib/boards";
import { REPORT_REASONS, timeAgo, type T } from "@/lib/i18n";

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

// ponytail: items stay cards in a <ul>, not a Table: excerpts wrap over lines, each row holds its own forms, and a table
// would scroll sideways on phones (e2e also finds items as <li>).
const item = "border-l-4 text-sm";
const meta = "flex flex-wrap items-center gap-2 text-xs";

function OpenPost({ id, t }: { id: string; t: T }) {
  return <Button href={`/posts/${id}`} label={t("원문 보기")} variant="ghost" icon={<Icon name="external" size={15} />} className="ml-auto" />;
}

export default async function AdminPage() {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!canViewQueue(user)) redirect("/feed");
  // The demo moderator (judges) sees the real queue, but cannot act on it.
  const readOnly = !isAdmin(user);

  const [open, events, appeals, flagged, [qa]] = await Promise.all([
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
    // Success measure: of the questions asked this week, how many the asker marked solved or settled with an accepted answer.
    q<{ asked: number; solved: number; accepted: number }>(
      `SELECT count(*)::int AS asked, count(*) FILTER (WHERE solved)::int AS solved,
         count(*) FILTER (WHERE accepted_comment_id IS NOT NULL)::int AS accepted
       FROM boundless.posts WHERE created_at > now() - interval '7 days' AND NOT hidden AND kind = ANY($1)`,
      [ASKING_TAGS],
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="OPS · QUEUE" title={t("운영 큐")} desc={t("접수된 신고와 재심 요청을 오래된 순서로 보여 줘요.")} />
      {readOnly && (
        <div className="mx-4 mt-4">
          <Banner role="status" status="warning" collapsible={false} title={t("시연용 운영자 계정이에요. 신고 내용과 지표는 실제와 같지만 처리 버튼은 꺼져 있어요.")} />
        </div>
      )}
      <div className="space-y-4 px-4 py-4">
        <Card className="border-l-4 border-l-primary text-sm">
          <p className="font-bold">{t("최근 7일 이용 지표")}</p>
          <p className="mt-1 text-[var(--color-text-secondary)]">{events.length ? events.map((e) => `${e.name} ${e.n}`).join(" · ") : "—"}</p>
          <p className="mt-1 text-[var(--color-text-secondary)]" data-solve-rate>
            {t("질문 {asked}개 중 해결 {solved}개 ({rate}%), 채택 {accepted}개", {
              asked: qa.asked,
              solved: qa.solved,
              accepted: qa.accepted,
              rate: qa.asked ? Math.round((qa.solved / qa.asked) * 100) : 0,
            })}
          </p>
        </Card>
        {flagged.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-extrabold">{t("AI 우선 확인 {n}건", { n: flagged.length })}</h2>
            <p className="mb-2 text-xs text-[var(--color-text-secondary)]">{t("최근 7일 동안 AI가 긴급·위기 신호를 읽은 글이에요. 글쓴이에게는 상담 번호가 안내됐어요.")}</p>
            <ul className="space-y-2">
              {flagged.map((f) => {
                const a = alertOf(f.alert);
                return (
                  <li key={f.id}>
                    <Card className={`${item} ${a?.crisis ? "border-l-[var(--color-error)]" : "border-l-[var(--color-warning)]"}`}>
                      <div className={meta}>
                        <Badge variant={a?.crisis ? "error" : "warning"} icon={<Icon name="siren" size={12} />} label={a ? t(a.ko) : f.alert} />
                        <NationalityChip code={f.nationality} lang={lang} />
                        <span className="ml-auto text-[var(--color-text-secondary)]">{timeAgo(f.created_at, lang)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[var(--color-text-secondary)]">{f.excerpt}</p>
                      <div className="mt-1 flex">
                        <OpenPost id={f.id} t={t} />
                      </div>
                    </Card>
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
                <li key={a.id}>
                  <Card className={`${item} border-l-primary`}>
                    <div className={meta}>
                      <Badge variant="info" label={t("재심")} />
                      <span>{a.is_comment ? t("댓글") : t("글")}</span>
                      <NationalityChip code={a.nationality} lang={lang} />
                      <span className="ml-auto text-[var(--color-text-secondary)]">{timeAgo(a.created_at, lang)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[var(--color-text-secondary)]">{a.excerpt}</p>
                    <p className="mt-2 rounded-xl bg-soft px-3 py-2">
                      <span className="font-bold">{t("작성자 사유")}</span> · {a.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(["restore", "uphold"] as const).map((action) => (
                        <form key={action} action={resolveAppeal}>
                          <input type="hidden" name="appeal" value={a.id} />
                          <input type="hidden" name="action" value={action} />
                          <Button
                            type="submit"
                            isDisabled={readOnly}
                            label={action === "restore" ? t("복구하기") : t("가림 유지")}
                            variant={action === "restore" ? "primary" : "secondary"}
                          />
                        </form>
                      ))}
                      <OpenPost id={a.post_id} t={t} />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
        {open.length === 0 && <Notice title={t("처리할 신고가 없어요")} />}
        <ul className="space-y-3">
          {open.map((r) => (
            <li key={r.id}>
              <Card className={`${item} border-l-[var(--color-error)]`}>
                <div className={meta}>
                  <Badge variant="error" label={t(REPORT_REASONS.find((x) => x.id === r.reason)?.ko ?? "기타")} />
                  <span>{r.is_comment ? t("댓글") : t("글")}</span>
                  <NationalityChip code={r.nationality} lang={lang} />
                  {r.same > 1 && <Badge variant="neutral" label={`×${r.same}`} />}
                  <span className="ml-auto text-[var(--color-text-secondary)]">{timeAgo(r.created_at, lang)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{r.excerpt}</p>
                {r.details && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">“{r.details}”</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["hide", "dismiss"] as const).map((action) => (
                    <form key={action} action={moderate}>
                      <input type="hidden" name="report" value={r.id} />
                      <input type="hidden" name="action" value={action} />
                      <Button
                        type="submit"
                        isDisabled={readOnly}
                        label={action === "hide" ? t("가리기") : t("문제 없음")}
                        variant={action === "hide" ? "destructive" : "secondary"}
                      />
                    </form>
                  ))}
                  <OpenPost id={r.post_id} t={t} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
