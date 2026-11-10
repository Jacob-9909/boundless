import Link from "next/link";
import { WithRail } from "@/components/Community";
import { FeedList, ListControls, listHref, parseSort } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { Avatar, Flag, Landmark, TagText, btn, btnGhost, card } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { BOARDS, isBoard } from "@/lib/boards";
import { cultureOf, DEFAULT_CULTURE } from "@/lib/cultures";
import { countryName, timeAgo } from "@/lib/i18n";
import { boardCounts, communityStats, listPosts } from "@/lib/posts";

export const metadata = { title: "Home" };

const chip = (on: boolean) =>
  `inline-flex h-9 items-center gap-2 rounded-full text-[13px] font-bold whitespace-nowrap transition ${on ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10 hover:ring-ink/25"}`;

export default async function Home(props: PageProps<"/feed">) {
  const sp = await props.searchParams;
  const sort = parseSort(sp.sort);
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const board = typeof sp.board === "string" && isBoard(sp.board) ? sp.board : undefined;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const viewer = user?.id ?? null;
  const [posts, stats, counts, lounge] = await Promise.all([
    listPosts(viewer, { board, before, sort: sort === "likes" ? "likes" : "new", waiting: sort === "waiting" }),
    communityStats(),
    boardCounts(),
    user ? listPosts(viewer, { space: user.nationality, limit: 3 }) : Promise.resolve([]),
  ]);
  const culture = user ? cultureOf(user.nationality) : DEFAULT_CULTURE;
  const country = user ? countryName(user.nationality, lang) : "";

  return (
    <WithRail viewer={viewer} lang={lang} t={t}>
      {/* Phones: tighter spacing and a shorter welcome card, so the first posts show on the first screen. */}
      <div className="min-w-0 space-y-3 md:space-y-5">
        {sp.blocked === "1" && (
          <p role="status" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
            {t("이 작성자를 차단했어요. 이제 이 사람의 글과 댓글은 보이지 않아요. 설정에서 해제할 수 있어요.")}
          </p>
        )}
        {/* Welcome + composer, like a community header with a "create post" bar */}
        <section className={`${card} overflow-hidden`}>
          <div className="relative overflow-hidden bg-primary px-4 py-4 text-paper md:px-6 md:py-5">
            <span className="bg-pattern absolute inset-0 opacity-30" aria-hidden="true" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" aria-hidden="true" />
            {/* On phones the landmark spans the card under the greeting, so it fades back there. */}
            <Landmark culture={culture} className="absolute right-0 bottom-0 h-20 w-auto opacity-40 sm:opacity-80 md:h-24" />
            <div className="relative max-w-lg [text-shadow:0_1px_6px_rgb(0_0_0/.35)]">
              {user ? (
                <>
                  <p className="flex items-center gap-2 text-[13px] font-bold opacity-90">
                    <Flag code={user.nationality} h={12} />
                    {country}
                  </p>
                  <h1 className="mt-1 font-culture text-2xl leading-tight text-balance md:text-4xl">{t("{hello}, 이웃님", { hello: culture.hello })}</h1>
                  <p className="mt-1.5 text-[13px] opacity-90 md:text-sm">
                    {t("오늘 새 글 {today}개 · 답변을 기다리는 질문 {waiting}개", { today: stats.today, waiting: stats.waiting })}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-[22px] leading-tight font-extrabold md:text-3xl">{t("한국 생활, 혼자 고민하지 마세요")}</h1>
                  <p className="mt-1.5 text-[13px] opacity-90 md:text-sm">{t("{countries}개국 이웃이 남긴 글 {posts}개와 답변 {answers}개가 있어요.", stats)}</p>
                </>
              )}
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-3 p-3 md:px-4">
              <span className="hidden sm:contents">
                <Avatar code={user.nationality} size={36} />
              </span>
              <Link
                href="/write"
                className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-ink/10 bg-paper pr-1.5 pl-4 transition hover:border-ink/25 hover:bg-white"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink/60">{t("한국 생활, 무엇이든 물어보세요")}</span>
                <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-[13px] font-bold text-paper">
                  <Icon name="edit" size={14} />
                  {t("글쓰기")}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 p-3 md:px-4">
              <Link href="/login" className={btn}>
                {t("로그인")}
              </Link>
              <Link href="/#demo" className={btnGhost}>
                {t("샘플 계정으로 체험")}
              </Link>
            </div>
          )}
        </section>

        {/* Phones and tablets: help numbers and the board directory. Boards themselves are the square's category chips below. */}
        <nav aria-label={t("공식 안내")} className="lg:hidden">
          <ul className="flex flex-wrap items-center gap-2">
            {/* Emergency numbers one tap from home: the user test took 7 taps and a dead-end search to reach 112/119. */}
            <li className="shrink-0">
              <Link href="/guide" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-700 px-3.5 text-[13px] font-bold whitespace-nowrap text-white">
                <Icon name="phone" size={14} />
                112 · 119 · {t("공식 안내")}
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/boards" className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-bold whitespace-nowrap text-primary hover:underline">
                {t("게시판 전체 보기")} →
              </Link>
            </li>
          </ul>
        </nav>

        {/* My country's lounge */}
        {user && (
          <section className={`${card} overflow-hidden`}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-ink/[.06] px-4 py-2.5 md:gap-x-3 md:py-3">
              <Flag code={user.nationality} h={16} />
              {/* min-w-48: when space runs out the lock note and link wrap below, not the title.
                  Phones show only the lock icon and the arrow, so the header stays on one line in long languages. */}
              <p className="min-w-48 flex-1 font-bold">{t("{country} 라운지", { country })}</p>
              <span className="inline-flex items-center gap-1 text-xs opacity-70" title={t("같은 국적만")}>
                <Icon name="lock" size={13} />
                <span className="max-sm:sr-only">{t("같은 국적만")}</span>
              </span>
              <Link href="/lounge" className="inline-flex h-9 min-w-9 items-center justify-center gap-1 text-[13px] font-bold whitespace-nowrap text-primary hover:underline">
                <span className="max-sm:sr-only">{t("들어가기")}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            {lounge.length ? (
              <ul className="divide-y divide-ink/[.06]">
                {lounge.map((p) => (
                  <li key={p.id}>
                    <Link href={`/posts/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper md:py-3">
                      <Avatar code={p.nationality} size={28} />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <TagText board={p.topic} tagId={p.kind} t={t} />
                        {p.title}
                      </span>
                      <span className="shrink-0 text-xs opacity-70">{timeAgo(p.created_at, lang)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Link href="/write?space=lounge" className="block px-4 py-3 text-sm opacity-70 hover:bg-paper md:py-4">
                {t("라운지가 아직 조용해요. 고향 이웃들에게 첫 인사를 남겨 보세요.")}
              </Link>
            )}
          </section>
        )}

        {/* Everyone's square */}
        <section className="space-y-3">
          <ListControls
            base="/feed"
            tag=""
            sort={sort}
            board={board}
            t={t}
            lead={
              <div>
                <h2 className="font-display text-lg font-extrabold tracking-tight md:text-xl">{t("모두의 광장")}</h2>
                <p className="hidden text-[13px] opacity-70 sm:block">{t("모든 나라 이웃이 함께 보는 최신 글")}</p>
              </div>
            }
          />
          {/* Categories at the top of the square, on every screen: filter here without leaving home.
              `relative` keeps the badges' absolute sr-only text inside the scroller; without it the page scrolls sideways on days with new posts. */}
          <nav aria-label={t("게시판")}>
            <ul className="relative -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0 md:pb-0">
              <li className="shrink-0">
                <Link href={listHref("/feed", { sort }, { board: "" })} aria-current={!board ? "page" : undefined} className={`${chip(!board)} px-3.5`}>
                  {t("전체")}
                </Link>
              </li>
              {BOARDS.map((b) => {
                const today = counts.find((x) => x.topic === b.id)?.today ?? 0;
                return (
                  <li key={b.id} className="shrink-0">
                    <Link href={listHref("/feed", { sort }, { board: b.id })} aria-current={board === b.id ? "page" : undefined} className={`${chip(board === b.id)} pr-3.5 pl-1.5`}>
                      <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ background: b.color }}>
                        <Icon name={b.icon} size={13} />
                      </span>
                      {t(b.ko)}
                      {!!today && (
                        <span className="rounded-full bg-alert px-1.5 text-[11px] leading-[18px] text-white">
                          <span aria-hidden="true">{today}</span>
                          <span className="sr-only">{t("새 글 {n}", { n: today })}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <FeedList
            posts={posts}
            lang={lang}
            t={t}
            emptyTitle={sort === "waiting" ? t("모든 질문에 답변이 달렸어요") : board ? t("이 게시판에는 아직 글이 없어요") : t("아직 글이 없어요")}
            emptyBody={t("첫 글을 남겨 이웃들과 이야기를 시작해 보세요.")}
            moreHref={sort === "new" ? (b) => listHref("/feed", { sort, board }, { before: b }) : undefined}
          />
        </section>
      </div>
    </WithRail>
  );
}
