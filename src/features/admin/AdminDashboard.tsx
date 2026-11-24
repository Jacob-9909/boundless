// The moderator dashboard: stat tiles, two 14-day bar charts and breakdowns, above the report queue (/admin).
// Plain HTML bars, no chart library. Single-series charts use one hue (the culture's primary) and carry a title
// instead of a legend; every bar has a hover tooltip and each chart has a screen-reader table.
import type { ReactNode } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "../../components/Icon";
import { Flag } from "../../components/ui";
import type { adminStats } from "@/features/admin/admin";
import { boardOf } from "@/features/posts/boards";
import { ALERTS } from "@/features/guide/guide";
import { countryName, type Lang, type T } from "@/features/i18n/i18n";

type Stats = Awaited<ReturnType<typeof adminStats>>;
export type SystemState = { ai: boolean; mail: boolean; demo: boolean; build: string };

// `solveRate` marks the success measure for e2e/flow.mjs, which reads it after an answer is accepted.
function Tile({ label, value, sub, solveRate }: { label: string; value: ReactNode; sub: string; solveRate?: boolean }) {
  return (
    <Card className="min-w-0 text-sm">
      <p className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none font-extrabold tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]" data-solve-rate={solveRate || undefined}>
        {sub}
      </p>
    </Card>
  );
}

function DayBars({ title, values, days, lang, t }: { title: string; values: number[]; days: Date[]; lang: Lang; t: T }) {
  const max = Math.max(1, ...values);
  const fmt = new Intl.DateTimeFormat(lang, { month: "numeric", day: "numeric" });
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <Card className="min-w-0 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">{t("14일 합계 {n}", { n: total })}</span>
      </div>
      <div className="mt-3 flex h-28 items-end gap-[2px] border-b border-[var(--color-border)]" aria-hidden="true">
        {values.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end" title={`${fmt.format(days[i])} · ${v}`}>
            <div className="w-full rounded-t-[4px] bg-primary transition group-hover:opacity-80" style={{ height: v ? `max(2px, ${(v / max) * 100}%)` : 0 }} />
          </div>
        ))}
      </div>
      {/* Axis labels only at both ends and the middle, so they never collide. */}
      <div className="mt-1 flex justify-between text-[11px] text-[var(--color-text-secondary)] tabular-nums" aria-hidden="true">
        <span>{fmt.format(days[0])}</span>
        <span>{fmt.format(days[Math.floor(days.length / 2)])}</span>
        <span>{fmt.format(days.at(-1)!)}</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {values.map((v, i) => (
            <tr key={i}>
              <th scope="row">{fmt.format(days[i])}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function HBars({ title, rows }: { title: string; rows: { key: string; label: ReactNode; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <Card className="min-w-0 text-sm">
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.5rem] items-center gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-xs">{r.label}</span>
            <span className="h-2.5 rounded-r-[4px] bg-primary" style={{ width: `${Math.max(2, (r.n / max) * 100)}%` }} aria-hidden="true" />
            <span className="text-right text-xs font-bold tabular-nums">{r.n}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Pill({ on, label, state }: { on: boolean; label: string; state: string }) {
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span>{label}</span>
      <span className={`inline-flex items-center gap-1 font-bold ${on ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
        <Icon name={on ? "check" : "alert"} size={13} />
        {state}
      </span>
    </li>
  );
}

export function AdminDashboard({ s, t, lang, system, eventName }: { s: Stats; t: T; lang: Lang; system: SystemState; eventName: Record<string, string> }) {
  const tt = s.totals;
  const m = s.answer.median;
  const wait = m === null ? "—" : m < 60 ? t("{n}분", { n: Math.max(1, Math.round(m)) }) : t("{n}시간", { n: Math.round(m / 6) / 10 });
  const rate = tt.asked_7d ? Math.round((tt.solved_7d / tt.asked_7d) * 100) : 0;
  const days = s.daily.map((d) => d.day);
  return (
    <section aria-labelledby="dash-title" className="space-y-4">
      <h2 id="dash-title" className="sr-only">
        {t("운영 대시보드")}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Tile label={t("전체 회원")} value={tt.members} sub={t("최근 7일 +{n}", { n: tt.members_7d })} />
        <Tile label={t("공개 글")} value={tt.posts} sub={t("최근 7일 +{n}", { n: tt.posts_7d })} />
        <Tile label={t("답변")} value={tt.answers} sub={t("최근 7일 +{n}", { n: tt.answers_7d })} />
        <Tile label={t("최근 7일 활동 회원")} value={tt.active_7d} sub={t("글이나 답변을 쓴 회원")} />
        <Tile label={t("첫 답변까지 (중앙값)")} value={wait} sub={t("최근 30일 질문 {asked}개 중 {answered}개에 답변", { asked: s.answer.asked, answered: s.answer.answered })} />
        <Tile
          label={t("질문 해결률 (7일)")}
          value={`${rate}%`}
          sub={t("질문 {asked}개 중 해결 {solved}개 ({rate}%), 채택 {accepted}개", { asked: tt.asked_7d, solved: tt.solved_7d, accepted: tt.accepted_7d, rate })}
          solveRate
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DayBars title={t("최근 14일 새 글")} values={s.daily.map((d) => d.posts)} days={days} lang={lang} t={t} />
        <DayBars title={t("최근 14일 답변")} values={s.daily.map((d) => d.answers)} days={days} lang={lang} t={t} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <HBars
          title={t("게시판별 글 (30일)")}
          rows={s.boards.map((b) => {
            const board = boardOf(b.topic);
            return {
              key: b.topic,
              n: b.n,
              label: (
                <>
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: board.color }} aria-hidden="true" />
                  <span className="truncate">{t(board.ko)}</span>
                </>
              ),
            };
          })}
        />
        <HBars
          title={t("국적별 회원")}
          rows={s.nations.map((c) => ({
            key: c.nationality,
            n: c.n,
            label: (
              <>
                <Flag code={c.nationality} h={11} />
                <span className="truncate">{countryName(c.nationality, lang)}</span>
              </>
            ),
          }))}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="min-w-0 text-sm">
          <h3 className="font-bold">{t("신고·재심 (30일)")}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            {(
              [
                [t("접수"), s.reports.received],
                [t("조치"), s.reports.actioned],
                [t("문제 없음"), s.reports.dismissed],
                [t("재심 대기"), tt.appeals_open],
                [t("가린 글"), tt.hidden],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-[var(--color-text-secondary)]">{k}</dt>
                <dd className="font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="min-w-0 text-sm">
          <h3 className="font-bold">{t("AI 위기 표시 (30일)")}</h3>
          {s.alerts.length ? (
            <ul className="mt-3 space-y-1.5 text-xs">
              {s.alerts.map((a) => {
                const def = ALERTS.find((x) => x.id === a.alert);
                return (
                  <li key={a.alert} className="flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Icon name="siren" size={12} className={def?.crisis ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"} />
                      <span className="truncate">{def ? t(def.ko) : a.alert}</span>
                    </span>
                    <b className="tabular-nums">{a.n}</b>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-[var(--color-text-secondary)]">{t("아직 없어요")}</p>
          )}
          <p className="mt-3 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-secondary)]">
            {t("저장된 AI 요약")} <b className="text-[var(--color-text-primary)] tabular-nums">{s.ai.summaries}</b> · {t("번역 저장")}{" "}
            <b className="text-[var(--color-text-primary)] tabular-nums">{s.ai.translations}</b>
          </p>
        </Card>
        <Card className="min-w-0 text-sm">
          <h3 className="font-bold">{t("시스템 상태")}</h3>
          <ul className="mt-3 space-y-1.5">
            <Pill on={system.ai} label={t("AI (NVIDIA NIM)")} state={system.ai ? t("켜짐") : t("꺼짐")} />
            <Pill on={system.mail} label={t("로그인 메일 (Gmail SMTP)")} state={system.mail ? t("설정됨") : t("설정 안 됨")} />
            <Pill on={system.demo} label={t("체험 계정")} state={system.demo ? t("켜짐") : t("꺼짐")} />
          </ul>
          <p className="mt-3 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-secondary)]">
            {t("버전")} {system.build}
          </p>
        </Card>
      </div>
      <Card className="text-sm">
        <h3 className="font-bold">{t("최근 7일 이용 지표")}</h3>
        <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
          {s.events.length ? s.events.map((e) => `${eventName[e.name] ?? e.name} ${e.n}`).join(" · ") : "—"}
        </p>
      </Card>
    </section>
  );
}
