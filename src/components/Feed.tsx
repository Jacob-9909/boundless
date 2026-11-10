import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Tag } from "@/lib/boards";
import type { Lang, T } from "@/lib/i18n";
import { PAGE, type PostRow } from "@/lib/posts";
import { Notice, PostCard, btnGhost, postList } from "./ui";

export type Sort = "new" | "likes" | "waiting";
export const parseSort = (v: unknown): Sort => (v === "likes" || v === "waiting" ? v : "new");

type ListOpts = { tag?: string; sort?: Sort; board?: string };

/** Builds a URL for the current list with one option changed. */
export function listHref(base: string, cur: ListOpts, change: ListOpts & { before?: string }) {
  const p = new URLSearchParams();
  const tag = change.tag ?? cur.tag;
  const sort = change.sort ?? cur.sort ?? "new";
  const board = change.board ?? cur.board;
  if (board) p.set("board", board);
  if (tag) p.set("tag", tag);
  if (sort !== "new") p.set("sort", sort);
  if (change.before) p.set("before", change.before);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

export function ListControls({ base, tags, tag, sort, board, t, lead }: { base: string; tags?: Tag[]; tag: string; sort: Sort; board?: string; t: T; lead?: ReactNode }) {
  const chip = (on: boolean) =>
    `inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap transition ${on ? "bg-ink text-white" : "bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-ink/25"}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {tags ? (
        <nav className="relative -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" aria-label={t("말머리")}>
          <Link href={listHref(base, { tag, sort }, { tag: "" })} className={chip(!tag)} aria-current={!tag ? "page" : undefined}>
            {t("전체")}
          </Link>
          {tags.map((x) => (
            <Link key={x.id} href={listHref(base, { tag, sort }, { tag: x.id })} className={chip(tag === x.id)} aria-current={tag === x.id ? "page" : undefined}>
              {t(x.ko)}
            </Link>
          ))}
        </nav>
      ) : (
        (lead ?? <span />)
      )}
      <div className="flex shrink-0 rounded-full bg-ink/[.06] p-1" role="tablist" aria-label={t("정렬")}>
        {(
          [
            ["new", t("최신")],
            ["likes", t("인기")],
            ["waiting", t("답변 대기")],
          ] as const
        ).map(([k, label]) => (
          <Link
            key={k}
            href={listHref(base, { tag, sort, board }, { sort: k })}
            role="tab"
            aria-selected={sort === k}
            className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-bold whitespace-nowrap transition ${sort === k ? "bg-white text-ink shadow-sm" : "text-ink/75 hover:text-ink"}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function FeedList({
  posts,
  lang,
  t,
  showBoard = true,
  emptyTitle,
  emptyBody,
  moreHref,
}: {
  posts: PostRow[];
  lang: Lang;
  t: T;
  showBoard?: boolean;
  emptyTitle: string;
  emptyBody?: string;
  moreHref?: (before: string) => string;
}) {
  if (!posts.length) {
    return (
      <Notice label={t("글 없음")} title={emptyTitle}>
        {emptyBody}
      </Notice>
    );
  }
  const last = posts.at(-1)!;
  return (
    <>
      <ul className={`stagger ${postList}`}>
        {posts.map((p, i) => (
          <li key={p.id} style={{ "--i": Math.min(i, 10) } as CSSProperties}>
            <PostCard post={p} lang={lang} t={t} showBoard={showBoard} />
          </li>
        ))}
      </ul>
      {moreHref && posts.length === PAGE && (
        <Link href={moreHref(new Date(last.listed_at).toISOString())} className={`${btnGhost} mt-3 w-full`}>
          {t("이전 글 더 보기")}
        </Link>
      )}
    </>
  );
}
