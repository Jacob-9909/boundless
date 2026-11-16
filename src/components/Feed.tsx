import type { CSSProperties, ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Token } from "@astryxdesign/core/Token";
import type { Tag } from "@/lib/boards";
import type { Lang, T } from "@/lib/i18n";
import { PAGE, type PostRow } from "@/lib/posts";
import { NavTabs } from "./NavTabs";
import { Notice, PostCard } from "./ui";

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

/**
 * Filter chip: an Astryx Token link. The current one is filled in the culture's ink; the others sit on the
 * card surface. Control height, so 44px on touch screens.
 */
export function FilterChip({ href, label, on, icon, endContent }: { href: string; label: string; on: boolean; icon?: ReactNode; endContent?: ReactNode }) {
  return (
    <Token
      href={href}
      label={label}
      size="lg"
      icon={icon}
      endContent={endContent}
      aria-current={on ? "page" : undefined}
      className={`h-[var(--size-element-md)] shrink-0 gap-1.5 rounded-full font-bold ${icon ? "pr-3.5 pl-1.5" : "px-3.5"} ${
        on ? "bg-ink text-white" : "bg-[var(--color-background-card)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border-emphasized)] ring-inset hover:text-[var(--color-text-primary)]"
      }`}
    />
  );
}

export function ListControls({ base, tags, tag, sort, board, t, lead }: { base: string; tags?: Tag[]; tag: string; sort: Sort; board?: string; t: T; lead?: ReactNode }) {
  const sorts = [
    ["new", t("최신")],
    ["likes", t("인기")],
    ["waiting", t("답변 대기")],
  ] as const;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {tags ? (
        <nav className="relative -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" aria-label={t("말머리")}>
          <FilterChip href={listHref(base, { tag, sort }, { tag: "" })} label={t("전체")} on={!tag} />
          {tags.map((x) => (
            <FilterChip key={x.id} href={listHref(base, { tag, sort }, { tag: x.id })} label={t(x.ko)} on={tag === x.id} />
          ))}
        </nav>
      ) : (
        (lead ?? <span />)
      )}
      <NavTabs label={t("정렬")} value={sort} tabs={sorts.map(([k, label]) => ({ value: k, label, href: listHref(base, { tag, sort, board }, { sort: k }) }))} />
    </div>
  );
}

/** Container for a list of posts: one Astryx Card, items split by hairlines (forum/Reddit style). */
export function PostList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Card padding={0} className="overflow-hidden">
      <ul className={`divide-y divide-[var(--color-border)] ${className}`}>{children}</ul>
    </Card>
  );
}

export function MoreButton({ href, t }: { href: string; t: T }) {
  return <Button href={href} label={t("이전 글 더 보기")} variant="secondary" size="lg" width="100%" className="mt-3" />;
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
      <PostList className="stagger">
        {posts.map((p, i) => (
          <li key={p.id} style={{ "--i": Math.min(i, 10) } as CSSProperties}>
            <PostCard post={p} lang={lang} t={t} showBoard={showBoard} />
          </li>
        ))}
      </PostList>
      {moreHref && posts.length === PAGE && <MoreButton href={moreHref(new Date(last.listed_at).toISOString())} t={t} />}
    </>
  );
}
