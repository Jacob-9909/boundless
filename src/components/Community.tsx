import Link from "next/link";
import type { ReactNode } from "react";
import { demoLogin } from "@/app/actions";
import { levelOf, LEVELS } from "@/lib/boards";
import { CULTURES, DEFAULT_CULTURE } from "@/lib/cultures";
import { HOTLINES } from "@/lib/guide";
import { countryName, timeAgo, type Lang, type T } from "@/lib/i18n";
import { hotPosts, listPosts, myPoints, ranking, recentActivity } from "@/lib/posts";
import { Icon } from "./Icon";
import { Avatar, LevelBadge, card } from "./ui";

const railTitle = "flex items-center gap-1.5 text-sm font-extrabold whitespace-nowrap";
const MEDALS = ["#E8B23A", "#9AA4B2", "#C27A45"];

/** Page body with the right rail beside it on wide screens (feed, lounge, boards). */
export function WithRail({ viewer, lang, t, children }: { viewer: string | null; lang: Lang; t: T; children: ReactNode }) {
  return (
    <div className="grid gap-6 px-4 py-4 md:px-6 md:py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      {children}
      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <RightRail viewer={viewer} lang={lang} t={t} />
        </div>
      </aside>
    </div>
  );
}

/** Right-hand column: who helps the most, my level, what needs an answer, what is popular, what just happened. */
export async function RightRail({ viewer, lang, t }: { viewer: string | null; lang: Lang; t: T }) {
  const [top, mine, waiting, hot, activity] = await Promise.all([
    ranking(5),
    viewer ? myPoints(viewer) : Promise.resolve(null),
    listPosts(viewer, { waiting: true, limit: 3 }),
    hotPosts(viewer),
    recentActivity(viewer, 4),
  ]);
  const lv = mine ? levelOf(mine.points) : null;
  return (
    <div className="space-y-4">
      {mine && lv && (
        <section className={`${card} overflow-hidden`}>
          <div className="relative bg-primary px-4 py-3 text-paper">
            {/* Pattern dimmed under the text; busy ones (US stars) sat on top of the level name */}
            <span className="bg-pattern absolute inset-0 opacity-30" aria-hidden="true" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/45 to-black/10" aria-hidden="true" />
            <p className="relative text-xs opacity-90">{t("내 이웃 레벨")}</p>
            <p className="relative flex items-baseline gap-2">
              <span className="font-display text-xl font-extrabold">{t(lv.ko)}</span>
              <span className="text-sm opacity-90">{t("{n}점", { n: mine.points })}</span>
            </p>
          </div>
          <div className="p-4">
            {lv.next ? (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label={t("내 이웃 레벨")} aria-valuemin={lv.min} aria-valuemax={lv.next.min} aria-valuenow={mine.points}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((mine.points - lv.min) / (lv.next.min - lv.min)) * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-xs opacity-70">{t("{next}까지 {n}점 남았어요", { next: t(lv.next.ko), n: lv.next.min - mine.points })}</p>
              </>
            ) : (
              <p className="text-xs opacity-70">{t("최고 레벨이에요. 이웃들에게 큰 힘이 되고 있어요.")}</p>
            )}
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                [mine.answers, t("답변")],
                [mine.helped, t("받은 도움돼요")],
                [mine.rank || "-", t("전체 순위")],
              ].map(([n, label]) => (
                <div key={String(label)} className="rounded-xl bg-paper py-2">
                  <dd className="font-display text-lg font-extrabold">{n}</dd>
                  <dt className="text-[11px] opacity-70">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {top.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <Icon name="trophy" size={16} className="text-[#E8B23A]" />
            {t("도움왕 랭킹")}
          </p>
          <p className="mt-0.5 text-xs opacity-70">{t("답변을 많이 하고 도움돼요를 많이 받은 이웃")}</p>
          <ol className="mt-3 space-y-2.5">
            {top.map((r, i) => (
              <li key={r.user_id} className="flex items-center gap-2.5">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                  style={{ background: MEDALS[i] ?? "rgba(20,22,28,.35)" }}
                >
                  {i + 1}
                </span>
                <Avatar code={r.nationality} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-bold">{t("{country} 이웃", { country: countryName(r.nationality, lang) })}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] opacity-70">
                    <LevelBadge points={r.points} t={t} />
                    {t("답변 {a} · 도움 {h}", { a: r.answers, h: r.helped })}
                  </span>
                </span>
                <span className="shrink-0 font-display text-sm font-extrabold text-primary">{r.points}</span>
              </li>
            ))}
          </ol>
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer py-1.5 font-bold opacity-70">{t("레벨은 어떻게 오르나요?")}</summary>
            <p className="mt-1.5 leading-relaxed opacity-70">{t("글 1점, 다른 이웃 글에 답변 2점, 도움돼요를 받으면 3점이에요.")}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {LEVELS.map((l) => (
                <li key={l.ko}>
                  <LevelBadge points={l.min} t={t} />
                  <span className="ml-0.5 opacity-70">{l.min}+</span>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {waiting.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <Icon name="comment" size={16} className="text-alert" />
            {t("답변을 기다리는 질문")}
          </p>
          <ul className="mt-2 divide-y divide-ink/[.06]">
            {waiting.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="flex items-start gap-2.5 py-2.5 hover:opacity-80">
                  <Avatar code={p.nationality} size={26} />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] leading-snug font-bold">{p.title}</span>
                    <span className="text-xs text-primary">{t("답변하고 +2점")} →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hot.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <Icon name="flame" size={16} className="text-alert" />
            {t("이번 주 인기 글")}
          </p>
          <ol className="mt-2 space-y-2">
            {hot.map((p, i) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                  <span className="w-4 font-display text-base font-extrabold text-alert">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{p.title}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs opacity-70">
                    <Icon name="helpful" size={13} />
                    {p.likes}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {activity.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t("최근 활동")}
          </p>
          <ul className="mt-2 space-y-3">
            {activity.map((a) => (
              <li key={a.id}>
                <Link href={`/posts/${a.post_id}`} className="flex gap-2.5 hover:opacity-80">
                  <Avatar code={a.nationality} size={26} />
                  <span className="min-w-0 text-xs leading-relaxed">
                    <span className="font-bold">{t("{country} 이웃이 답했어요", { country: countryName(a.nationality, lang) })}</span>
                    <span className="opacity-70"> · {timeAgo(a.created_at, lang)}</span>
                    <span className="block truncate opacity-70">“{a.body}”</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${card} p-4`}>
        <div className="flex items-center justify-between">
          <p className={railTitle}>
            <Icon name="phone" size={16} className="text-primary" />
            {t("공식 안내")}
          </p>
          <Link href="/guide" className="inline-flex h-8 items-center text-xs opacity-70 hover:underline">
            {t("전체 보기")}
          </Link>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5">
          {HOTLINES.slice(0, 4).map((h) => (
            <li key={h.tel}>
              <a href={`tel:${h.tel}`} className="block rounded-xl bg-paper px-2.5 py-2 hover:bg-soft">
                <span className="block font-display text-sm font-extrabold text-primary">{h.tel}</span>
                <span className="block truncate text-[11px] opacity-70">{t(h.name)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Sample-account switcher: every country with its name, greeting and avatar, current one checked. */
export function AccountSwitcher({ t, lang, current, up = true }: { t: T; lang: Lang; current: string; up?: boolean }) {
  const items = [...CULTURES, DEFAULT_CULTURE].map((c) => ({ c, code: c.code === "XX" ? "CA" : c.code }));
  return (
    <details className="group relative">
      <summary className="flex h-10 list-none items-center gap-2 rounded-xl bg-paper px-3 text-[13px] font-bold text-primary [&::-webkit-details-marker]:hidden">
        <Icon name="users" size={16} />
        {t("다른 나라 이웃으로 바꾸기")}
        <Icon name="down" size={16} className="ml-auto transition group-open:rotate-180" />
      </summary>
      <div className={`absolute left-0 z-40 w-[300px] rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/10 ${up ? "bottom-full mb-2" : "top-full mt-2"}`}>
        <p className="px-2 pt-1 pb-2 text-xs opacity-70">{t("나라를 누르면 그 나라 샘플 이웃으로 바로 바뀌어요.")}</p>
        <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto">
          {items.map(({ c, code }) => {
            const on = code === current;
            return (
              <li key={c.code}>
                <form action={demoLogin.bind(null, c.code)}>
                  <button
                    aria-current={on ? "true" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition ${on ? "bg-soft" : "hover:bg-paper"}`}
                  >
                    <Avatar code={code} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{c.code === "XX" ? t("그 밖의 나라 (캐나다)") : countryName(code, lang)}</span>
                      <span className="block truncate font-culture text-xs opacity-70" style={{ fontFamily: `var(${c.font}), var(--font-brand), sans-serif` }}>
                        {c.hello} · {c.native}
                      </span>
                    </span>
                    {on && <Icon name="check" size={18} className="text-primary" />}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
