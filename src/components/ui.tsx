import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { boardOf, DEALS, levelOf, tagOf } from "@/lib/boards";
import { cultureOf, landmarkMarkup, patternUrl, type Culture } from "@/lib/cultures";
import type { Help } from "@/lib/guide";
import { countryName, langAutonym, regionLabel, timeAgo, type Lang, type T } from "@/lib/i18n";
import type { PostRow } from "@/lib/posts";
import { toggleLike } from "@/app/actions";
import { Icon } from "./Icon";

/* Design tokens. Radius: containers 16-24px, controls 12px, tags 6px, pills full.
   Height: controls 44px (h-11), compact actions 36px (h-9). Type: body 15px, meta 13px, tags 12px. */
export const card = "rounded-2xl border border-ink/[.07] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]";
export const btn =
  "inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-5 text-[15px] font-bold text-paper transition hover:brightness-110 active:scale-[.98] disabled:opacity-50";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-ink/15 bg-white px-5 text-[15px] font-bold text-primary transition hover:border-primary/40";
export const pill = "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold transition";
export const tag = "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold";
export const field =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
export const labelCls = "mb-1.5 block text-sm font-bold";

/** Seoul subway line colors: the brand's "many lines, one network" motif. */
export const LINES = ["#0052A4", "#00A84D", "#EF7C1C", "#00A5DE", "#996CAC", "#E6186C", "#CD7C2F", "#747F00"];

/**
 * Logo: a speech bubble drawn as four colored arcs that never close (no borders),
 * with a dot at the center for the person speaking.
 */
export function Logo({ className = "", size = 30, word = true }: { className?: string; size?: number; word?: boolean }) {
  const arcs = [LINES[0], LINES[1], LINES[2], LINES[5]];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
        <g transform="rotate(-40 18 17)">
          {arcs.map((c, i) => (
            <circle key={c} cx="18" cy="17" r="12" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" pathLength={100} strokeDasharray="14 86" strokeDashoffset={-i * 25} />
          ))}
        </g>
        <path d="M11.5 26.6 L7.5 33.5 L16 29.4 Z" fill={arcs[1]} />
        <circle cx="18" cy="17" r="3.4" fill="currentColor" />
      </svg>
      {word && <span className="font-display text-[20px] leading-none font-extrabold tracking-[-0.03em]">boundless</span>}
    </span>
  );
}

/** SVG flag (emoji flags render as letters on Windows). `round` crops to a circle. */
export function Flag({ code, h = 14, round = false, className = "" }: { code: string; h?: number; round?: boolean; className?: string }) {
  return (
    <Image
      src={`/flags/${code}.svg`}
      alt=""
      width={round ? h : Math.round(h * 1.5)}
      height={h}
      unoptimized
      className={`inline-block shrink-0 object-cover shadow-[0_0_0_1px_rgba(0,0,0,.1)] ${round ? "rounded-full" : "rounded-[3px]"} ${className}`}
    />
  );
}

/** The culture's landmark or landscape silhouette (static markup from lib/landmarks). */
export function Landmark({ culture, className = "" }: { culture: Culture; className?: string }) {
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: landmarkMarkup(culture) }} />
  );
}

/** Anonymous avatar: the author's culture pattern in a circle, with their flag as a badge. */
export function Avatar({ code, size = 40 }: { code: string; size?: number }) {
  const c = cultureOf(code);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="block size-full rounded-full ring-1 ring-black/5"
        style={{ backgroundColor: c.c.primary, backgroundImage: patternUrl(c), backgroundSize: `${Math.round(size * 0.85)}px`, backgroundPosition: "center" }}
      />
      <span className="absolute -right-0.5 -bottom-0.5 flex rounded-full bg-white p-[1.5px]">
        <Flag code={code} h={Math.max(12, Math.round(size * 0.38))} round />
      </span>
    </span>
  );
}

/** Member level (points from answers and helpful votes). */
export function LevelBadge({ points, t }: { points: number; t: T }) {
  const l = levelOf(points);
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-bold whitespace-nowrap" style={{ background: l.color + "1A", color: `color-mix(in oklab, ${l.color} 40%, black)` }}>
      <Icon name="sparkles" size={11} />
      {t(l.ko)}
    </span>
  );
}

/** A board, with its icon on its color. */
export function BoardBadge({ id, t, href }: { id: string; t: T; href?: string }) {
  const b = boardOf(id);
  const inner = (
    <>
      <span className="flex size-[18px] items-center justify-center rounded-full text-white" style={{ background: b.color }}>
        <Icon name={b.icon} size={11} />
      </span>
      {t(b.ko)}
    </>
  );
  const cls = "inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/[.05] py-0.5 pr-2.5 pl-0.5 text-xs font-semibold";
  return href ? (
    <Link href={href} className={`${cls} hover:bg-ink/10`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/** 말머리, written the way Korean communities do: [질문] */
export function TagText({ board, tagId, t }: { board: string; tagId: string; t: T }) {
  return <span className="mr-1 font-bold whitespace-nowrap text-primary">[{t(tagOf(board, tagId).ko)}]</span>;
}

export function MarketLine({ post, t }: { post: Pick<PostRow, "price" | "deal" | "kind" | "place">; t: T }) {
  if (post.price === null) return null;
  const deal = DEALS.find((d) => d.id === post.deal) ?? DEALS[0];
  // Giveaways read as 나눔중 / 나눔완료 instead of 판매중 / 거래완료.
  const label = post.kind === "free" ? (deal.id === "open" ? "나눔중" : deal.id === "done" ? "나눔완료" : deal.ko) : deal.ko;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-display text-base font-extrabold whitespace-nowrap">{post.kind === "free" ? t("나눔") : `${post.price.toLocaleString("ko-KR")}${t("원")}`}</span>
      <span className={`${tag} ${deal.id === "done" ? "bg-ink/10 text-ink/75" : deal.id === "reserved" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{t(label)}</span>
      {/* The meeting spot was saved but never shown, so buyers had to ask where to meet. */}
      {post.place && (
        <span className="inline-flex items-center gap-1 text-sm" title={t("거래 희망 동네")}>
          <Icon name="pin" size={14} />
          {post.place}
        </span>
      )}
    </span>
  );
}

export function EventLine({ post, t }: { post: Pick<PostRow, "starts_on" | "ends_on" | "place">; t: T }) {
  if (!post.starts_on && !post.place) return null;
  const d = (s: string) => s.slice(5).replace("-", ".");
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold">
      {post.starts_on && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap" title={t("기간")}>
          <Icon name="ticket" size={14} />
          {d(post.starts_on)}
          {post.ends_on && post.ends_on !== post.starts_on && ` – ${d(post.ends_on)}`}
        </span>
      )}
      {post.place && (
        <span className="inline-flex items-center gap-1" title={t("장소")}>
          <Icon name="pin" size={14} />
          {post.place}
        </span>
      )}
    </span>
  );
}

/** Self-declared nationality, colored with that culture's palette. */
export function NationalityChip({ code, lang, prefix }: { code: string; lang: Lang; prefix?: string }) {
  const c = cultureOf(code).c;
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1.5 text-xs font-semibold whitespace-nowrap"
      style={{ background: c.soft, color: c.ink, borderColor: c.primary + "40" } as CSSProperties}
    >
      <Flag code={code} h={12} />
      {prefix && <span className="opacity-70">{prefix} ·</span>}
      <span className="truncate">{countryName(code, lang)}</span>
    </span>
  );
}

export function StationLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`station-label flex items-center gap-2 ${className}`}>
      <span className="inline-block size-2.5 rounded-full border-2 border-current bg-paper" />
      {children}
    </p>
  );
}

/** Page banner: soft culture color with the member's pattern fading in from the right. */
export function PageHead({ line, title, desc, children }: { line: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    // Phones: a compact banner (about 120px) so the page's content starts on the first screen.
    <header className="relative overflow-hidden bg-soft px-4 pt-4 pb-5 md:mx-4 md:mt-6 md:rounded-3xl md:px-8 md:pt-8 md:pb-9">
      <span
        className="bg-pattern absolute inset-y-0 right-0 w-2/5 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
        style={{ backgroundColor: "var(--c-primary)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <StationLabel className="text-primary">{line}</StationLabel>
        <h1 className="mt-1.5 font-display text-2xl leading-tight font-extrabold tracking-tight md:mt-2 md:text-4xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-xl text-sm leading-relaxed opacity-80 md:mt-2 md:text-[15px]">{desc}</p>}
        {children}
      </div>
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-4 pt-3 md:pt-5">
      <Link href={href} className="inline-flex h-9 items-center gap-0.5 rounded-full pr-3 text-sm font-bold text-primary">
        <Icon name="back" size={18} />
        {label}
      </Link>
    </div>
  );
}

export function Notice({ tone = "info", label, title, children }: { tone?: "info" | "error"; label?: string; title: string; children?: ReactNode }) {
  const err = tone === "error";
  return (
    <div className={`rounded-2xl border border-dashed p-5 ${err ? "border-red-300 bg-red-50 text-red-950" : "border-ink/25 bg-white/70"}`} role={err ? "alert" : undefined}>
      {label && <StationLabel className={`mb-1.5 ${err ? "text-red-700" : "text-primary"}`}>{label}</StationLabel>}
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="mt-1 text-sm leading-relaxed">{children}</div>}
    </div>
  );
}

/** Container for a list of posts: one surface, items split by hairlines (forum/Reddit style). */
export const postList = `${card} divide-y divide-ink/[.07] overflow-hidden`;

const action = "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 transition";

/**
 * Feed item. One line says where and who (board + nationality + level), then the question,
 * the best answer so far, and actions. The title link stretches over the whole item;
 * the helpful toggle sits above it so it can be pressed in place.
 */
export function PostCard({ post, lang, t, showBoard = true }: { post: PostRow; lang: Lang; t: T; showBoard?: boolean }) {
  const board = boardOf(post.topic);
  const asks = tagOf(post.topic, post.kind).asks;
  const waiting = asks && post.comments === 0 && !post.solved;
  return (
    <article className="group relative px-4 py-3.5 transition-colors hover:bg-paper/70 md:px-5 md:py-4">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]">
        {showBoard ? (
          <>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: board.color }}>
              <Icon name={board.icon} size={11} />
            </span>
            <span className="font-bold whitespace-nowrap">{t(board.ko)}</span>
            <span className="opacity-40" aria-hidden="true">
              •
            </span>
            <Flag code={post.nationality} h={11} />
          </>
        ) : (
          <Avatar code={post.nationality} size={22} />
        )}
        <span className={`whitespace-nowrap ${showBoard ? "" : "font-bold"}`}>{t("{country} 이웃", { country: countryName(post.nationality, lang) })}</span>
        <LevelBadge points={post.points} t={t} />
        <span className="whitespace-nowrap opacity-70">
          {post.region && `· ${regionLabel(post.region, t)} `}· {timeAgo(post.created_at, lang)}
        </span>
      </div>

      <h2 className="mt-2 font-display text-[17px] leading-snug font-bold [overflow-wrap:anywhere] md:text-lg">
        <Link href={`/posts/${post.id}`} className="after:absolute after:inset-0 after:z-10 group-hover:underline">
          <TagText board={post.topic} tagId={post.kind} t={t} />
          {post.title}
        </Link>
      </h2>
      {(board.extra === "market" || board.extra === "event") && (
        <div className="mt-1.5">{board.extra === "market" ? <MarketLine post={post} t={t} /> : <EventLine post={post} t={t} />}</div>
      )}
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed opacity-75 [overflow-wrap:anywhere]">{post.body}</p>

      {post.top_answer && (
        <div className="mt-3 flex gap-2.5 border-l-2 border-primary/40 pl-3">
          <Avatar code={post.top_answer.nationality} size={22} />
          <p className="line-clamp-2 min-w-0 text-[13px] leading-relaxed [overflow-wrap:anywhere]">
            <span className="mr-1 font-bold text-primary">{t("가장 도움된 답변")}</span>
            <span className="opacity-80">{post.top_answer.body}</span>
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold">
        <form action={toggleLike} className="relative z-20">
          <input type="hidden" name="post" value={post.id} />
          <button
            aria-pressed={post.liked}
            aria-label={`${t("도움돼요")} ${post.likes}`}
            className={`${action} ${post.liked ? "bg-primary text-paper" : "bg-ink/[.05] hover:bg-ink/10"}`}
          >
            <Icon name="helpful" size={15} />
            {post.likes}
          </button>
        </form>
        <span className={`${action} bg-ink/[.05]`} aria-label={`${t("댓글")} ${post.comments}`}>
          <Icon name="comment" size={15} />
          {post.comments}
        </span>
        <span className={`${action} px-2 font-medium opacity-70`} title={t("원문")}>
          <Icon name="globe" size={13} />
          {langAutonym(post.lang, lang)}
        </span>
        {post.solved ? (
          <span className={`${tag} ml-auto bg-emerald-700 text-white`}>
            <Icon name="check" size={12} />
            {t("해결됨")}
          </span>
        ) : (
          // On my own question "Answer →" reads like an instruction to myself; say it is waiting instead.
          waiting && (post.mine ? <span className="ml-auto whitespace-nowrap opacity-70">{t("답변 대기")}</span> : <span className="ml-auto font-bold whitespace-nowrap text-primary">{t("답변하기")} →</span>)
        )}
      </div>
    </article>
  );
}

export function SignInRequired({ t, next, title, desc }: { t: T; next: string; title?: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-3xl p-4 md:pt-8">
      <div className="rounded-2xl border-l-4 border-primary bg-soft/60 p-5">
        <StationLabel className="text-primary">{t("로그인 필요")}</StationLabel>
        <p className="mt-1.5 font-display text-lg font-bold">{title ?? t("로그인하면 볼 수 있어요")}</p>
        <p className="mt-1 text-sm opacity-80">{desc ?? t("이 정보는 내 계정에서만 보여요.")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={btn}>
            {t("로그인")}
          </Link>
          <Link href="/#demo" className={btnGhost}>
            {t("샘플 계정으로 체험")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** One official hotline or website. External links open in a new tab. */
export function HelpItem({ h, t }: { h: Help; t: T }) {
  const href = h.tel ? `tel:${h.tel}` : h.url;
  return (
    <a
      href={href}
      {...(h.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${card} flex flex-wrap items-start gap-x-3 gap-y-2 p-3.5 transition hover:border-primary/40`}
    >
      <span
        className={`flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 font-display text-sm font-extrabold whitespace-nowrap ${h.tel ? "bg-primary text-paper" : "bg-soft text-primary"}`}
      >
        <Icon name={h.tel ? "phone" : "external"} size={14} />
        {h.tel}
      </span>
      {/* min-w-44: in a narrow column a long number like 1577-1366 puts the text below it instead of squeezing it into six lines. */}
      <span className="min-w-44 flex-1">
        <span className="block text-sm font-bold">{t(h.name)}</span>
        <span className="mt-0.5 block text-xs leading-relaxed opacity-75">{t(h.desc)}</span>
        {h.url && <span className="mt-0.5 block truncate text-xs text-primary">{h.url.replace("https://", "")}</span>}
      </span>
    </a>
  );
}
