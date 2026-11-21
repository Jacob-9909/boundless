import { redirect } from "next/navigation";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { moderate, resolveAppeal, setStaffRole } from "@/app/actions";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SelectField, TextField } from "@/components/fields";
import { Icon } from "@/components/Icon";
import { NationalityChip, Notice, PageHead } from "@/components/ui";
import { adminStats } from "@/lib/admin";
import { aiEnabled } from "@/lib/ai";
import { canModerate, canViewQueue, demoEnabled, envAdmins, getT, getUser, isAdmin } from "@/lib/auth";
import { q } from "@/lib/db";
import { ALERTS, alertOf } from "@/lib/guide";
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

type LogLine = { id: string; actor_email: string; action: string; post_id: string | null; subject_email: string | null; detail: string | null; created_at: Date };

/** "moderator@gmail.com" -> "m***@gmail.com". Only admins, who grant roles by email, see addresses in full. */
const mask = (email: string) => email.replace(/^(.)[^@]*/, "$1***");

function OpenPost({ id, t }: { id: string; t: T }) {
  return <Button href={`/posts/${id}`} label={t("원문 보기")} variant="ghost" icon={<Icon name="external" size={15} />} className="ml-auto" />;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [{ lang, t }, user, { staff: staffResult }] = await Promise.all([getT(), getUser(), searchParams]);
  // Usage metric names (track() in actions.ts) as people read them.
  const eventName: Record<string, string> = {
    search: t("검색"),
    post: t("글쓰기"),
    comment: t("답변"),
    signup: t("가입"),
    report: t("신고"),
    appeal: t("재심"),
    accepted: t("채택"),
    solved: t("해결됨"),
    helpful: t("도움돼요"),
    bump: t("도움 요청"),
    ai_check: t("AI 점검"),
  };
  if (!canViewQueue(user)) redirect("/feed");
  // The demo moderator (judges) sees the real queue, but cannot act on it.
  const readOnly = !canModerate(user);
  const admin = isAdmin(user);
  const roleName: Record<string, string> = { member: t("일반 회원"), moderator: t("운영자"), admin: t("관리자") };
  const actionName: Record<string, string> = {
    hide: t("신고 글 가림"),
    dismiss: t("신고 문제 없음"),
    restore: t("재심 복구"),
    uphold: t("재심 가림 유지"),
    role: t("역할 변경"),
  };
  const staffNote: Record<string, { status: "success" | "error"; title: string }> = {
    ok: { status: "success", title: t("역할을 바꿨어요.") },
    unknown: { status: "error", title: t("그 이메일로 가입한 회원이 없어요.") },
    fixed: { status: "error", title: t("내 역할과 ADMIN_EMAILS에 있는 관리자의 역할은 여기서 바꿀 수 없어요.") },
    sample: { status: "error", title: t("체험용 샘플 계정에는 역할을 줄 수 없어요.") },
    invalid: { status: "error", title: t("이메일과 역할을 확인해 주세요.") },
  };

  const [open, appeals, flagged, stats, log, staffRows] = await Promise.all([
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
    adminStats(),
    q<LogLine>(
      `SELECT id, actor_email, action, COALESCE(post_id, (SELECT c.post_id FROM boundless.comments c WHERE c.id = comment_id)) AS post_id,
         subject_email, detail, created_at
       FROM boundless.staff_log ORDER BY created_at DESC LIMIT 30`,
    ),
    admin ? q<{ email: string; role: string }>("SELECT email, role FROM boundless.users WHERE role <> 'member' ORDER BY role, email") : [],
  ]);
  const team = [...envAdmins().map((email) => ({ email, role: "admin", env: true })), ...staffRows.filter((r) => !envAdmins().includes(r.email)).map((r) => ({ ...r, env: false }))];
  // On/off only, never a value: the demo moderator sees this too.
  const system = { ai: aiEnabled(), mail: Boolean(process.env.EMAIL_SENDER && process.env.EMAIL_PASSWORD), demo: demoEnabled(), build: process.env.APP_BUILD ?? "" };

  return (
    <div className="mx-auto max-w-5xl lg:ml-2 pb-6">
      <PageHead title={t("운영 대시보드")} desc={t("서비스 전체 상태를 한 화면에서 확인해요. 아래에는 신고와 재심 요청이 오래된 순서로 쌓여요.")} />
      {readOnly && (
        <div className="mx-4 mt-4">
          <Banner role="status" status="warning" collapsible={false} title={t("시연용 운영자 계정이에요. 신고 내용과 지표는 실제와 같지만 처리 버튼은 꺼져 있어요.")} />
        </div>
      )}
      <div className="space-y-4 px-4 py-4">
        <AdminDashboard s={stats} t={t} lang={lang} system={system} eventName={eventName} />
        <h2 className="border-t border-[var(--color-border)] pt-5 font-display text-xl font-extrabold">{t("처리 큐")}</h2>
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

        <section aria-labelledby="log-title" className="border-t border-[var(--color-border)] pt-5">
          <h2 id="log-title" className="font-display text-xl font-extrabold">{t("처리 기록")}</h2>
          <p className="mb-2 text-xs text-[var(--color-text-secondary)]">{t("운영진이 내린 결정이 누가, 언제, 무엇을 했는지와 함께 남아요. 최근 30건이에요.")}</p>
          {log.length === 0 ? (
            <Notice title={t("아직 처리 기록이 없어요")} />
          ) : (
            <Card padding={0}>
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {log.map((l) => (
                  <li key={l.id} className="flex min-h-11 flex-wrap items-center gap-2 px-4 py-2">
                    <Badge variant={l.action === "hide" || l.action === "uphold" ? "error" : l.action === "role" ? "info" : "neutral"} label={actionName[l.action] ?? l.action} />
                    <span className="text-[var(--color-text-secondary)]">{admin ? l.actor_email : mask(l.actor_email)}</span>
                    {l.action === "role" && l.subject_email && (
                      <span>
                        {admin ? l.subject_email : mask(l.subject_email)} → {roleName[l.detail ?? ""] ?? l.detail}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-[var(--color-text-secondary)]">{timeAgo(l.created_at, lang)}</span>
                    {l.post_id && <Button href={`/posts/${l.post_id}`} label={t("보기")} variant="ghost" />}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {admin && (
          <section id="staff" aria-labelledby="staff-title" className="scroll-mt-20 border-t border-[var(--color-border)] pt-5">
            <h2 id="staff-title" className="font-display text-xl font-extrabold">{t("운영진")}</h2>
            <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
              {t("운영자는 신고와 재심을 처리하고, 관리자는 여기서 역할도 줄 수 있어요. ADMIN_EMAILS에 있는 관리자는 환경변수에서만 바꿔요.")}
            </p>
            {staffResult && staffNote[String(staffResult)] && (
              <div className="mb-3">
                <Banner role="status" status={staffNote[String(staffResult)].status} collapsible={false} title={staffNote[String(staffResult)].title} />
              </div>
            )}
            <Card padding={0}>
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {team.map((m) => (
                  <li key={m.email} className="flex min-h-11 flex-wrap items-center gap-2 px-4 py-2">
                    <span className="font-bold">{m.email}</span>
                    <Badge variant={m.role === "admin" ? "info" : "neutral"} label={roleName[m.role]} />
                    {m.env && <span className="text-xs text-[var(--color-text-secondary)]">ADMIN_EMAILS</span>}
                  </li>
                ))}
              </ul>
            </Card>
            <form action={setStaffRole} className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <TextField name="email" label={t("회원 이메일")} type="email" width="100%" isRequired />
              </div>
              <div className="w-40">
                <SelectField
                  name="role"
                  label={t("역할")}
                  defaultValue="moderator"
                  width="100%"
                  options={(["moderator", "admin", "member"] as const).map((r) => ({ value: r, label: roleName[r] }))}
                />
              </div>
              <Button type="submit" label={t("역할 바꾸기")} variant="primary" />
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
