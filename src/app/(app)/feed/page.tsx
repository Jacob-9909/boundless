import Link from "next/link";
import { WithRail } from "@/components/Community";
import { FeedList, ListControls, listHref, parseSort } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { Avatar, Flag, Landmark, TagText, btn, btnGhost, card } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { BOARDS } from "@/lib/boards";
import { cultureOf, DEFAULT_CULTURE } from "@/lib/cultures";
import { countryName, timeAgo } from "@/lib/i18n";
import { boardCounts, communityStats, listPosts } from "@/lib/posts";

export const metadata = { title: "Home" };

export default async function Home(props: PageProps<"/feed">) {
  const sp = await props.searchParams;
  const sort = parseSort(sp.sort);
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const viewer = user?.id ?? null;
  const [posts, stats, counts, lounge] = await Promise.all([
    listPosts(viewer, { before, sort: sort === "likes" ? "likes" : "new", waiting: sort === "waiting" }),
    communityStats(),
    boardCounts(),
    user ? listPosts(viewer, { space: user.nationality, limit: 3 }) : Promise.resolve([]),
  ]);
  const culture = user ? cultureOf(user.nationality) : DEFAULT_CULTURE;
  const country = user ? countryName(user.nationality, lang) : "";

  return (
    <WithRail viewer={viewer} lang={lang} t={t}>
      <div className="min-w-0 space-y-5">
        {/* Welcome + composer, like a community header with a "create post" bar */}
        <section className={`${card} overflow-hidden`}>
          <div className="relative overflow-hidden bg-primary px-5 py-5 text-paper md:px-6">
            <span className="bg-pattern absolute inset-0 opacity-30" aria-hidden="true" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" aria-hidden="true" />
            <Landmark culture={culture} className="absolute right-0 bottom-0 h-20 w-auto opacity-80 md:h-24" />
            <div className="relative max-w-lg [text-shadow:0_1px_6px_rgb(0_0_0/.35)]">
              {user ? (
                <>
                  <p className="flex items-center gap-2 text-[13px] font-bold opacity-90">
                    <Flag code={user.nationality} h={12} />
                    {country}
                  </p>
                  <h1 className="mt-1 font-culture text-3xl leading-tight text-balance md:text-4xl">{t("{hello}, 이웃님", { hello: culture.hello })}</h1>
                  <p className="mt-1.5 text-[13px] opacity-90 md:text-sm">
                    {t("오늘 새 글 {today}개 · 답변을 기다리는 질문 {waiting}개", { today: stats.today, waiting: stats.waiting })}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-2xl leading-tight font-extrabold md:text-3xl">{t("한국 생활, 혼자 고민하지 마세요")}</h1>
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

        {/* Topics as chips on phones and tablets; the desktop sidebar already lists them */}
        <nav aria-label={t("게시판")} className="lg:hidden">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0 md:pb-0">
            {BOARDS.map((b) => {
              const c = counts.find((x) => x.topic === b.id);
              return (
                <li key={b.id} className="shrink-0">
                  <Link href={`/b/${b.id}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-white pr-3.5 pl-1.5 text-[13px] font-bold whitespace-nowrap ring-1 ring-ink/10 transition hover:ring-ink/25">
                    <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ background: b.color }}>
                      <Icon name={b.icon} size={13} />
                    </span>
                    {t(b.ko)}
                    {!!c?.today && (
                      <span className="rounded-full bg-alert px-1.5 text-[11px] leading-[18px] text-white">
                        <span aria-hidden="true">{c.today}</span>
                        <span className="sr-only">{t("새 글 {n}", { n: c.today })}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            <li className="shrink-0">
              <Link href="/boards" className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-bold whitespace-nowrap text-primary hover:underline">
                {t("전체 보기")} →
              </Link>
            </li>
          </ul>
        </nav>

        {/* My country's lounge */}
        {user && (
          <section className={`${card} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-ink/[.06] px-4 py-3">
              <Flag code={user.nationality} h={16} />
              <p className="flex-1 font-bold">{t("{country} 라운지", { country })}</p>
              <span className="inline-flex items-center gap-1 text-xs opacity-70">
                <Icon name="lock" size={13} />
                {t("같은 국적만")}
              </span>
              <Link href="/lounge" className="inline-flex h-8 items-center text-[13px] font-bold whitespace-nowrap text-primary hover:underline">
                {t("들어가기")} →
              </Link>
            </div>
            {lounge.length ? (
              <ul className="divide-y divide-ink/[.06]">
                {lounge.map((p) => (
                  <li key={p.id}>
                    <Link href={`/posts/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
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
              <Link href="/write?space=lounge" className="block px-4 py-4 text-sm opacity-70 hover:bg-paper">
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
            t={t}
            lead={
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-tight">{t("모두의 광장")}</h2>
                <p className="text-[13px] opacity-70">{t("모든 나라 이웃이 함께 보는 최신 글")}</p>
              </div>
            }
          />
          <FeedList
            posts={posts}
            lang={lang}
            t={t}
            emptyTitle={sort === "waiting" ? t("모든 질문에 답변이 달렸어요") : t("아직 글이 없어요")}
            emptyBody={t("첫 글을 남겨 이웃들과 이야기를 시작해 보세요.")}
            moreHref={sort === "new" ? (b) => listHref("/feed", { sort }, { before: b }) : undefined}
          />
        </section>
      </div>
    </WithRail>
  );
}
