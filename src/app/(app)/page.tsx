import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { Flag, Notice, PostCard, StationLabel, btnGhost, card } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { cultureOf, themeVars } from "@/lib/cultures";
import { HOTLINES } from "@/lib/guide";
import { countryName, kindLabel, regionLabel, TOPICS } from "@/lib/i18n";
import { hotPosts, listPosts, nationalityCounts, PAGE } from "@/lib/posts";

const notch = "[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%,0_38%,18%_28%)]";
const sectionTitle = "font-display text-xl font-extrabold tracking-tight";

export default async function Home(props: PageProps<"/">) {
  const before = (await props.searchParams).before;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const [posts, counts, hot] = await Promise.all([
    listPosts(user?.id ?? null, { before: typeof before === "string" ? before : undefined }),
    nationalityCounts(),
    before ? Promise.resolve([]) : hotPosts(user?.id ?? null),
  ]);
  // Spotlight a question nobody has answered yet, so neighbors can help first.
  const waiting = posts.find((p) => p.kind === "question" && p.comments === 0);
  const featured = waiting ?? posts.find((p) => p.kind === "question") ?? posts[0];
  const last = posts.at(-1);

  return (
    <>
      <section className="bg-soft px-4 pt-5 pb-6">
        <StationLabel className="text-primary">LINE 01 · {t("주제 정거장")}</StationLabel>
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-4">
          <ol className="relative flex flex-col justify-between gap-4 py-1 before:absolute before:top-3 before:bottom-3 before:left-[7px] before:w-[3px] before:rounded-full before:bg-primary">
            {TOPICS.map((tp) => (
              <li key={tp.id} className="relative">
                <Link href={`/search?topic=${tp.id}`} className="flex min-h-7 items-center gap-2.5 text-sm font-bold hover:underline">
                  <span className="size-[17px] shrink-0 rounded-full border-[3px] border-primary bg-paper" />
                  {t(tp.ko)}
                </Link>
              </li>
            ))}
          </ol>

          {featured ? (
            <Link
              href={`/posts/${featured.id}`}
              style={themeVars(cultureOf(featured.nationality)) as CSSProperties}
              className={`relative flex min-h-56 flex-col justify-end overflow-hidden bg-primary p-4 text-paper ${notch}`}
            >
              <span className="bg-pattern absolute inset-0 opacity-25" aria-hidden="true" />
              <span className="relative flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-bold opacity-95">
                {waiting ? t("답변을 기다려요") : kindLabel(featured.kind, t)} · <Flag code={featured.nationality} h={11} />
                {countryName(featured.nationality, lang)}
              </span>
              <span className="relative mt-1.5 line-clamp-3 font-display text-[22px] leading-tight font-extrabold [overflow-wrap:anywhere]">
                {featured.title}
              </span>
            </Link>
          ) : (
            <div className={`relative flex min-h-56 flex-col justify-end overflow-hidden bg-primary p-4 text-paper ${notch}`}>
              <span className="bg-pattern absolute inset-0 opacity-25" aria-hidden="true" />
              <span className="relative font-display text-[22px] leading-tight font-extrabold">{t("한국 생활, 무엇이든 물어보세요")}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <form action="/search" className="flex h-12 flex-1 items-center gap-2 rounded-full border-2 border-ink bg-white pr-2 pl-4 focus-within:ring-4 focus-within:ring-primary/15">
            <Icon name="search" size={18} className="opacity-70" />
            <input name="q" placeholder={t("글 검색")} aria-label={t("글 검색")} className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:text-ink/60" />
          </form>
          <Link href="/write" className="inline-flex h-12 items-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-bold text-paper transition hover:brightness-110">
            <Icon name="plus" size={18} />
            {t("글쓰기")}
          </Link>
        </div>
      </section>

      {counts.length > 0 && (
        <section className="border-y border-ink/10 bg-white px-4 py-4">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Icon name="users" size={16} className="text-primary" />
            {t("{n}개국 이웃이 함께하고 있어요", { n: counts.length })}
          </p>
          <p className="mt-0.5 text-xs opacity-60">{t("국기를 누르면 그 나라 이웃의 글을 모아 봐요")}</p>
          <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {counts.map((c) => (
              <li key={c.nationality} className="shrink-0">
                <Link
                  href={`/search?from=${c.nationality}`}
                  title={t("{country} 이웃의 글", { country: countryName(c.nationality, lang) })}
                  aria-label={t("{country} 이웃의 글", { country: countryName(c.nationality, lang) })}
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition hover:brightness-95"
                  style={{ background: cultureOf(c.nationality).c.soft, color: cultureOf(c.nationality).c.ink }}
                >
                  <Flag code={c.nationality} h={13} />
                  {c.n}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hot.length > 0 && (
        <section className="px-4 pt-6">
          <h2 className={`${sectionTitle} flex items-center gap-1.5`}>
            <Icon name="flame" size={20} className="text-extra" />
            {t("이번 주 인기 글")}
          </h2>
          <ol className={`${card} mt-3 divide-y divide-ink/10 overflow-hidden`}>
            {hot.map((p, i) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="flex min-h-12 items-center gap-3 px-4 py-2.5 hover:bg-soft/40">
                  <span className="w-4 font-display text-lg font-extrabold text-extra">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs opacity-70">
                    <Flag code={p.nationality} h={11} />
                    <Icon name="helpful" size={13} />
                    {p.likes}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="px-4 py-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className={sectionTitle}>{t("최신 글")}</h2>
          <span className="flex items-center gap-3 text-[13px]">
            {user?.region && (
              <Link href={`/search?region=${user.region}`} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                <Icon name="pin" size={14} />
                {t("{region} 글만", { region: regionLabel(user.region, t) })}
              </Link>
            )}
            <Link href="/search" className="opacity-70 hover:underline">
              {t("전체 주제")}
            </Link>
          </span>
        </div>
        {posts.length ? (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id}>
                <PostCard post={p} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        ) : (
          <Notice label={t("글 없음")} title={t("아직 글이 없어요")}>
            {t("전체 주제를 보거나 먼저 이야기를 시작해 보세요.")}
          </Notice>
        )}
        {last && posts.length === PAGE && (
          <Link href={`/?before=${encodeURIComponent(new Date(last.created_at).toISOString())}`} className={`${btnGhost} mt-4 w-full`}>
            {t("이전 글 더 보기")}
          </Link>
        )}
      </section>

      <section className="border-t border-ink/10 px-4 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className={sectionTitle}>{t("공식 안내")}</h2>
          <Link href="/guide" className="inline-flex items-center text-[13px] opacity-70 hover:underline">
            {t("전체 보기")}
            <Icon name="next" size={14} />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {HOTLINES.slice(0, 4).map((h) => (
            <li key={h.tel}>
              <a href={`tel:${h.tel}`} className={`${card} block p-3 transition hover:border-primary/40`}>
                <span className="flex items-center gap-1.5 font-display text-lg font-extrabold text-primary">
                  <Icon name="phone" size={15} />
                  {h.tel}
                </span>
                <span className="mt-0.5 block truncate text-xs opacity-75">{h.name[lang]}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
