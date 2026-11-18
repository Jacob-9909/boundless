import Link from "next/link";
import { Button } from "@astryxdesign/core/Button";
import { WithRail } from "@/components/Community";
import { ListControls, listHref, MoreButton, parseSort } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { Avatar, CultureScene, Flag, LevelBadge, Notice, SignInRequired, TagText } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { LOUNGE } from "@/lib/boards";
import { cultureOf } from "@/lib/cultures";
import { countryName, timeAgo, type Lang, type T } from "@/lib/i18n";
import { listPosts, loungeCount, memberCount, PAGE, type PostRow } from "@/lib/posts";

export const metadata = { title: "Lounge" };

/** A country's lounge: only members of that nationality can read and write here. */
export default async function LoungePage(props: PageProps<"/lounge">) {
  const sp = await props.searchParams;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  if (!user)
    return (
      <SignInRequired
        t={t}
        next="/lounge"
        title={t("우리나라 라운지는 같은 국적 이웃만 들어올 수 있어요")}
        desc={t("로그인하면 내 나라 이웃들과 우리말로 이야기할 수 있어요.")}
      />
    );
  const culture = cultureOf(user.nationality);
  const country = countryName(user.nationality, lang);
  const tag = LOUNGE.tags.some((x) => x.id === sp.tag) ? String(sp.tag) : "";
  const sort = parseSort(sp.sort);
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [posts, total, members] = await Promise.all([
    listPosts(user.id, { space: user.nationality, tag, before, sort: sort === "likes" ? "likes" : "new", waiting: sort === "waiting" }),
    loungeCount(user.nationality),
    memberCount(user.nationality),
  ]);
  const neighbors = members || 1;

  return (
    <WithRail viewer={user.id} lang={lang} t={t}>
      <div className="min-w-0 space-y-4">
        <header className="relative overflow-hidden rounded-2xl bg-primary p-4 text-paper md:rounded-3xl md:p-8">
          <CultureScene culture={culture} variant="banner" />
          <span className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent sm:from-black/50 sm:via-black/10" aria-hidden="true" />
          <div className="relative max-w-xl">
            <p className="flex items-center gap-2 text-sm font-bold opacity-90">
              <Flag code={user.nationality} h={14} />
              {t("{country} 라운지", { country })}
            </p>
            <h1 className="mt-1.5 font-culture text-2xl leading-tight md:mt-2 md:text-[42px]">{culture.greet}</h1>
            <p className="mt-2 text-sm opacity-90 [text-shadow:0_1px_6px_rgb(0_0_0/.4)]">{t("{country} 이웃만 볼 수 있는 공간이에요. 우리말로 편하게 이야기해요.", { country })}</p>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-85 [text-shadow:0_1px_6px_rgb(0_0_0/.4)]">
              <span className="inline-flex items-center gap-1">
                <Icon name="users" size={14} />
                {t("이웃 {n}명", { n: neighbors })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="file" size={14} />
                {t("글 {n}개", { n: total })}
              </span>
              {/* The sentence above already says who can see it; phones skip the repeat. */}
              <span className="hidden items-center gap-1 sm:inline-flex">
                <Icon name="lock" size={14} />
                {t("다른 나라 이웃에게는 보이지 않아요")}
              </span>
            </p>
            <Button
              href="/write?space=lounge"
              label={t("라운지에 쓰기")}
              variant="secondary"
              size="lg"
              icon={<Icon name="edit" size={17} />}
              className="mt-4 bg-white text-primary md:mt-5"
            />
          </div>
        </header>
        {/* The lounge reads as its own board, not the shared feed: a framed panel in the culture's color with a title
            bar, a pinned notice and compact rows (말머리 · 제목 · 글쓴이 · 날짜 · 조회 · 도움) like a classic community board. */}
        <section aria-label={t("{country} 라운지", { country })} className="overflow-hidden rounded-2xl border-2 border-primary/70 bg-[var(--color-background-card)]">
          <div className="bg-pattern h-2 bg-primary bg-[length:auto_24px]" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-primary/5 px-4 py-3">
            <h2 className="flex min-w-0 items-center gap-2 font-display text-lg font-extrabold">
              <Flag code={user.nationality} h={16} />
              <span className="truncate">{t("{country} 라운지", { country })}</span>
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-paper">
              <Icon name="lock" size={11} />
              {t("같은 국적만")}
            </span>
            <span className="ml-auto text-xs text-[var(--color-text-secondary)] tabular-nums">
              {t("이웃 {n}명", { n: neighbors })} · {t("글 {n}개", { n: total })}
            </span>
          </div>
          <div className="px-4 pt-3 pb-2">
            <ListControls base="/lounge" tags={LOUNGE.tags} tag={tag} sort={sort} t={t} />
          </div>
          <LoungeRows posts={posts} lang={lang} t={t} country={country} />
        </section>
        {sort === "new" && posts.length === PAGE && <MoreButton href={listHref("/lounge", { tag, sort }, { before: new Date(posts.at(-1)!.listed_at).toISOString() })} t={t} />}
      </div>
    </WithRail>
  );
}

// A server component renders once per request, so "now" here is the request time (like timeAgo).
const isFresh = (d: Date) => new Date(d).getTime() > Date.now() - 86_400_000;

/** Board rows: one line on desktop under column labels, two short lines on a phone. A pinned notice comes first. */
function LoungeRows({ posts, lang, t, country }: { posts: PostRow[]; lang: Lang; t: T; country: string }) {
  const cols = "sm:grid sm:grid-cols-[4.5rem_minmax(0,1fr)_7.5rem_4.5rem_3rem_3rem] sm:items-center sm:gap-3";
  return (
    <div className="text-sm">
      <div className={`hidden border-y border-[var(--color-border)] bg-[var(--color-background-muted)] px-4 py-2 text-xs font-bold text-[var(--color-text-secondary)] ${cols}`} aria-hidden="true">
        <span className="text-center">{t("말머리")}</span>
        <span>{t("제목")}</span>
        <span>{t("글쓴이")}</span>
        <span className="text-right">{t("날짜")}</span>
        <span className="text-right">{t("조회")}</span>
        <span className="text-right">{t("도움돼요")}</span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        <li className={`flex items-center gap-2 bg-primary/5 px-4 py-2.5 ${cols}`}>
          <span className="inline-flex shrink-0 justify-center">
            <span className="rounded bg-primary px-1.5 py-0.5 text-[11px] font-bold text-paper">{t("공지")}</span>
          </span>
          <span className="min-w-0 font-bold sm:col-span-5">{t("{country} 이웃만 볼 수 있는 공간이에요. 우리말로 편하게 이야기해요.", { country })}</span>
        </li>
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.id}`} className={`block px-4 py-2.5 transition hover:bg-primary/5 ${cols}`}>
              <span className="hidden text-center text-xs sm:block">
                <TagText board="lounge" tagId={p.kind} t={t} />
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="sm:hidden">
                  <TagText board="lounge" tagId={p.kind} t={t} />
                </span>
                <span className="truncate font-semibold">{p.title}</span>
                {p.comments > 0 && <span className="shrink-0 text-xs font-bold text-primary tabular-nums">[{p.comments}]</span>}
                {p.image && <Icon name="image" size={13} className="shrink-0 opacity-60" />}
                {p.solved && <Icon name="check" size={13} className="shrink-0 text-[var(--color-success)]" />}
                {isFresh(p.created_at) && (
                  <span className="shrink-0 rounded-sm bg-alert px-1 text-[10px] leading-4 font-bold text-white" title={t("새 글")}>
                    N
                  </span>
                )}
              </span>
              <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-[var(--color-text-secondary)] sm:mt-0">
                <Avatar code={p.nationality} size={20} look={p.avatar} />
                <LevelBadge points={p.points} t={t} className="min-w-0" />
                <span className="sm:hidden">· {timeAgo(p.listed_at, lang)} · {t("조회 {n}", { n: p.views })}</span>
              </span>
              <span className="hidden text-right text-xs text-[var(--color-text-secondary)] tabular-nums sm:block">{timeAgo(p.listed_at, lang)}</span>
              <span className="hidden text-right text-xs text-[var(--color-text-secondary)] tabular-nums sm:block">{p.views}</span>
              <span className="hidden text-right text-xs text-[var(--color-text-secondary)] tabular-nums sm:block">{p.likes}</span>
            </Link>
          </li>
        ))}
      </ul>
      {!posts.length && (
        <div className="p-4">
          <Notice label={t("글 없음")} title={t("라운지가 아직 조용해요")}>
            {t("고향 이웃들에게 첫 인사를 남겨 보세요.")}
          </Notice>
        </div>
      )}
    </div>
  );
}
