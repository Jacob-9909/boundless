import Link from "next/link";
import { WithRail } from "@/components/Community";
import { FeedList, ListControls, listHref, parseSort } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { Avatar, Flag, Landmark, TagText, card } from "@/components/ui";
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
        {/* Welcome: in the member's language, on their culture's pattern and landmark */}
        <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-paper md:p-8">
          <span className="bg-pattern absolute inset-0 opacity-30" aria-hidden="true" />
          <span className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" aria-hidden="true" />
          <Landmark culture={culture} className="absolute right-0 bottom-0 h-28 w-auto opacity-90 md:h-40" />
          <div className="relative max-w-lg">
            {user ? (
              <>
                <p className="flex items-center gap-2 text-sm font-bold opacity-90">
                  <Flag code={user.nationality} h={13} />
                  {country}
                </p>
                <h1 className="mt-1.5 font-culture text-4xl leading-tight text-balance md:text-5xl">{t("{hello}, 이웃님", { hello: culture.hello })}</h1>
                <p className="mt-2 text-sm opacity-90 [text-shadow:0_1px_6px_rgb(0_0_0/.4)] md:text-[15px]">
                  {t("오늘 새 글 {today}개 · 답변을 기다리는 질문 {waiting}개", { today: stats.today, waiting: stats.waiting })}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl leading-tight font-extrabold md:text-[42px]">{t("한국 생활, 혼자 고민하지 마세요")}</p>
                <p className="mt-2 text-sm opacity-90 md:text-[15px]">{t("{countries}개국 이웃이 남긴 글 {posts}개와 답변 {answers}개가 있어요.", stats)}</p>
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {user ? (
                <Link href="/write" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-[15px] font-bold whitespace-nowrap text-primary shadow-sm hover:bg-white/90">
                  <Icon name="edit" size={17} />
                  {t("글쓰기")}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-[15px] font-bold whitespace-nowrap text-primary hover:bg-white/90">
                    {t("로그인")}
                  </Link>
                  <Link href="/#demo" className="inline-flex h-11 items-center rounded-xl bg-white/15 px-5 text-[15px] font-bold whitespace-nowrap backdrop-blur hover:bg-white/25">
                    {t("샘플 계정으로 체험")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Boards at a glance */}
        <section>
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold tracking-tight">{t("게시판")}</h2>
            <Link href="/boards" className="inline-flex h-8 items-center text-[13px] opacity-70 hover:underline">
              {t("전체 보기")}
            </Link>
          </div>
          <ul className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
            {BOARDS.map((b) => {
              const c = counts.find((x) => x.topic === b.id);
              return (
                <li key={b.id} className="w-[104px] shrink-0 snap-start sm:w-auto">
                  <Link href={`/b/${b.id}`} className={`${card} flex h-full flex-col items-start gap-2 p-3 transition hover:-translate-y-0.5 hover:shadow-md`}>
                    <span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: b.color }}>
                      <Icon name={b.icon} size={18} />
                    </span>
                    <span className="text-[13px] leading-tight font-bold">{t(b.ko)}</span>
                    <span className="text-[11px] opacity-70">{c?.today ? t("새 글 {n}", { n: c.today }) : t("글 {n}개", { n: c?.n ?? 0 })}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

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
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight">{t("모두의 광장")}</h2>
            <p className="text-[13px] opacity-70">{t("모든 나라 이웃이 함께 보는 최신 글")}</p>
          </div>
          <ListControls base="/feed" tag="" sort={sort} t={t} />
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
