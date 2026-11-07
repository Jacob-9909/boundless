import Link from "next/link";
import { notFound } from "next/navigation";
import { WithRail } from "@/components/Community";
import { FeedList, ListControls, listHref, parseSort } from "@/components/Feed";
import { Icon } from "@/components/Icon";
import { getT, getUser } from "@/lib/auth";
import { boardOf, isBoard } from "@/lib/boards";
import { listPosts } from "@/lib/posts";

export default async function BoardPage(props: PageProps<"/b/[board]">) {
  const { board: id } = await props.params;
  if (!isBoard(id)) notFound();
  const sp = await props.searchParams;
  const board = boardOf(id);
  const tag = board.tags.some((x) => x.id === sp.tag) ? String(sp.tag) : "";
  const sort = parseSort(sp.sort);
  const before = typeof sp.before === "string" && sort === "new" ? sp.before : undefined;
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const posts = await listPosts(user?.id ?? null, { board: id, tag, before, sort: sort === "likes" ? "likes" : "new", waiting: sort === "waiting" });
  const base = `/b/${id}`;

  return (
    <WithRail viewer={user?.id ?? null} lang={lang} t={t}>
      <div className="min-w-0 space-y-4">
        <header className="relative overflow-hidden rounded-3xl p-6 text-white md:p-8" style={{ background: `color-mix(in oklab, ${board.color} 72%, black)` }}>
          <span className="absolute -right-6 -bottom-10 opacity-15" aria-hidden="true">
            <Icon name={board.icon} size={200} />
          </span>
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="station-label opacity-90">BOARD · {t(board.ko)}</p>
              <h1 className="mt-1.5 flex items-center gap-3 font-display text-3xl font-extrabold md:text-4xl">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20">
                  <Icon name={board.icon} size={24} />
                </span>
                {t(board.ko)}
              </h1>
              <p className="mt-2 text-sm leading-relaxed opacity-90 md:text-[15px]">{t(board.desc)}</p>
            </div>
            <Link
              href={`/write?board=${id}${tag ? `&kind=${tag}` : ""}`}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-[15px] font-bold whitespace-nowrap shadow-sm hover:bg-white/90"
              style={{ color: `color-mix(in oklab, ${board.color} 72%, black)` }}
            >
              <Icon name="edit" size={17} />
              {t("이 게시판에 쓰기")}
            </Link>
          </div>
        </header>
        <ListControls base={base} tags={board.tags} tag={tag} sort={sort} t={t} />
        <FeedList
          posts={posts}
          lang={lang}
          t={t}
          showBoard={false}
          emptyTitle={sort === "waiting" ? t("모든 질문에 답변이 달렸어요") : t("아직 글이 없어요")}
          emptyBody={t("첫 글을 남겨 이웃들과 이야기를 시작해 보세요.")}
          moreHref={sort === "new" ? (b) => listHref(base, { tag, sort }, { before: b }) : undefined}
        />
      </div>
    </WithRail>
  );
}
