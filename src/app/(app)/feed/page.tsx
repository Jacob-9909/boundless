import Link from "next/link";
import type { CSSProperties } from "react";
import { RightRail } from "@/components/Community";
import { Icon } from "@/components/Icon";
import { Avatar, Notice, PostCard, btnGhost, card } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { cultureOf, DEFAULT_CULTURE, themeVars } from "@/lib/cultures";
import { isTopic, TOPICS } from "@/lib/i18n";
import { communityStats, listPosts, PAGE, topicCounts } from "@/lib/posts";

export const metadata = { title: "Feed" };

type Sort = "new" | "likes" | "waiting";

export default async function Feed(props: PageProps<"/feed">) {
  const sp = await props.searchParams;
  const topic = isTopic(String(sp.topic ?? "")) ? String(sp.topic) : "";
  const sort: Sort = sp.sort === "likes" || sp.sort === "waiting" ? sp.sort : "new";
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const viewer = user?.id ?? null;
  const [posts, stats, tcounts] = await Promise.all([
    listPosts(viewer, { topic, before, sort: sort === "likes" ? "likes" : "new", waiting: sort === "waiting" }),
    communityStats(),
    topicCounts(),
  ]);
  const culture = user ? cultureOf(user.nationality) : DEFAULT_CULTURE;
  const last = posts.at(-1);
  const total = tcounts.reduce((a, c) => a + c.n, 0);
  const href = (o: { topic?: string; sort?: Sort }) => {
    const p = new URLSearchParams();
    const tp = o.topic ?? topic;
    const so = o.sort ?? sort;
    if (tp) p.set("topic", tp);
    if (so !== "new") p.set("sort", so);
    const s = p.toString();
    return s ? `/feed?${s}` : "/feed";
  };
  const tabCls = (on: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition ${on ? "bg-ink text-white" : "bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-ink/25"}`;

  return (
    <div className="grid gap-6 px-4 py-4 md:px-6 md:py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {/* Welcome: a member is greeted in their own language, on their own culture's pattern */}
        <section style={themeVars(culture) as CSSProperties} className="relative overflow-hidden rounded-3xl bg-primary p-6 text-paper md:p-8">
          <span className="bg-pattern absolute inset-0 opacity-30" aria-hidden="true" />
          <span className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              {user ? (
                <>
                  <p className="font-culture text-3xl leading-tight md:text-[40px]">{t("{hello}, 이웃님", { hello: culture.hello })}</p>
                  <p className="mt-2 text-sm opacity-90 md:text-[15px]">
                    {t("오늘 새 글 {today}개 · 답변을 기다리는 질문 {waiting}개", { today: stats.today, waiting: stats.waiting })}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl leading-tight font-extrabold md:text-[40px]">{t("한국 생활, 혼자 고민하지 마세요")}</p>
                  <p className="mt-2 text-sm opacity-90 md:text-[15px]">{t("{countries}개국 이웃이 남긴 글 {posts}개와 답변 {answers}개가 있어요.", stats)}</p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {user ? (
                <Link
                  href="/write"
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-[15px] font-bold text-primary shadow-sm hover:bg-white/90"
                >
                  <Icon name="plus" size={18} />
                  {t("질문하기")}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-[15px] font-bold text-primary hover:bg-white/90">
                    {t("로그인")}
                  </Link>
                  <Link
                    href="/#demo"
                    className="inline-flex h-11 items-center rounded-xl bg-white/15 px-5 text-[15px] font-bold backdrop-blur hover:bg-white/25"
                  >
                    {t("샘플 계정으로 체험")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Composer prompt */}
        <div className={`${card} flex items-center gap-3 p-3 md:p-4`}>
          {user ? <Avatar code={user.nationality} size={40} /> : <span className="size-10 shrink-0 rounded-full bg-ink/10" />}
          <Link
            href="/write"
            className="flex h-11 min-w-0 flex-1 items-center truncate rounded-full bg-paper px-4 text-[15px] text-ink/50 transition hover:bg-soft"
          >
            {t("한국 생활, 무엇이 궁금한가요?")}
          </Link>
          <Link
            href="/write?kind=experience"
            className="hidden h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold text-primary ring-1 ring-primary/25 hover:bg-soft sm:inline-flex"
          >
            <Icon name="edit" size={15} />
            {t("경험 나누기")}
          </Link>
        </div>

        {/* Topic lines + sort */}
        <div className="flex flex-col gap-3">
          <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0" aria-label={t("주제")}>
            <Link href={href({ topic: "" })} className={tabCls(!topic)} aria-current={!topic ? "page" : undefined}>
              {t("전체")} <span className="opacity-60">{total}</span>
            </Link>
            {TOPICS.map((tp) => (
              <Link key={tp.id} href={href({ topic: tp.id })} className={tabCls(topic === tp.id)} aria-current={topic === tp.id ? "page" : undefined}>
                <span className="size-2.5 rounded-full ring-2 ring-white" style={{ background: tp.color }} />
                {t(tp.ko)} <span className="opacity-60">{tcounts.find((c) => c.topic === tp.id)?.n ?? 0}</span>
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 self-start rounded-full bg-ink/[.06] p-1" role="tablist" aria-label={t("정렬")}>
            {(
              [
                ["new", t("최신")],
                ["likes", t("인기")],
                ["waiting", t("답변 대기")],
              ] as const
            ).map(([k, label]) => (
              <Link
                key={k}
                href={href({ sort: k })}
                role="tab"
                aria-selected={sort === k}
                className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-bold transition ${sort === k ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {posts.length ? (
          <ul className="stagger space-y-3">
            {posts.map((p, i) => (
              <li key={p.id} style={{ "--i": Math.min(i, 10) } as CSSProperties}>
                <PostCard post={p} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        ) : sort === "waiting" ? (
          <Notice title={t("모든 질문에 답변이 달렸어요")}>{t("이웃들 덕분이에요. 새 질문이 올라오면 여기에 보여요.")}</Notice>
        ) : (
          <Notice label={t("글 없음")} title={t("아직 글이 없어요")}>
            {t("전체 주제를 보거나 먼저 이야기를 시작해 보세요.")}
          </Notice>
        )}
        {last && posts.length === PAGE && sort === "new" && (
          <Link
            href={`${href({})}${href({}).includes("?") ? "&" : "?"}before=${encodeURIComponent(new Date(last.created_at).toISOString())}`}
            className={`${btnGhost} w-full`}
          >
            {t("이전 글 더 보기")}
          </Link>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <RightRail viewer={viewer} lang={lang} t={t} />
        </div>
      </aside>
    </div>
  );
}
