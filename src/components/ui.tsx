import Image from "next/image";
import Link from "next/link";
import { Fragment, useId, type CSSProperties, type ReactNode } from "react";
import { boardOf, DEALS, levelOf, tagOf } from "@/features/posts/boards";
import { lookStyle, parseLook } from "@/features/avatar/avatar";
import { cultureOf, groundMarkup, patternUrl, type Culture } from "@/features/culture/cultures";
import { sceneOf } from "@/features/culture/scenes";
import type { Help } from "@/features/guide/guide";
import { countryName, langAutonym, regionLabel, timeAgo, type Lang, type T } from "@/features/i18n/i18n";
import type { PostRow } from "@/features/posts/posts";
import { toggleLike } from "@/app/actions";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon, type IconName } from "./Icon";

/* Controls, cards, badges and banners come from Astryx (@astryxdesign/core) with the Boundless theme
   (src/themes/boundless); see docs/ASTRYX.md. For hand-built surfaces, use the Astryx tokens through
   Tailwind arbitrary values, e.g. bg-[var(--color-background-card)] or rounded-[var(--radius-container)]. */

/** Seoul subway line colors: the brand's "many lines, one network" motif. */
export const LINES = ["#0052A4", "#00A84D", "#EF7C1C", "#00A5DE", "#996CAC", "#E6186C", "#CD7C2F", "#747F00"];

/**
 * Logo: ㅂ, the Korean letter for the b in boundless, sewn like a jogakbo (조각보), the wrapping cloth pieced
 * together from scraps. Each patch is a Seoul subway line color. The small patch at the top right is the newest
 * one, the newcomer: pass `mine` to sew it in the member's own culture color. Seams are open gaps, so the mark
 * sits on any background. Same drawing as src/app/icon.svg (see docs/brand/logo-concepts.html).
 */
const LOGO_SHAPE = "M8 8H16V17H32V8H40V40H8ZM16 25V32H32V25Z"; // 48 box, strokes 8 thick, open top
const LOGO_PATCHES: [string, string][] = [
  ["0,0 27,0 27,30 0,30", LINES[3]],
  ["27,14 48,14 48,48 24,48 24,30 27,30", LINES[4]],
  ["0,30 24,30 24,48 0,48", LINES[1]],
];
const LOGO_MINE = "27,0 48,0 48,14 27,14";
// Each seam crosses one stroke and ends in open space, so the letter's outline never breaks.
const LOGO_SEAMS = "M31 14H41M27 16V26M7 30H17M24 31V41";

export function Logo({ className = "", size = 30, word = true, mine = LINES[2] }: { className?: string; size?: number; word?: boolean; mine?: string }) {
  // The phone header renders two logos and hides one; a shared clip or mask id inside a hidden svg would not paint.
  const id = useId();
  // Wider seams at small sizes so they stay visible.
  const gap = size <= 24 ? 2.4 : size <= 40 ? 1.8 : 1.4;
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: size * 0.24 }}>
      <svg width={size} height={size} viewBox="4 4 40 40" aria-hidden="true" className="shrink-0">
        <defs>
          <clipPath id={`${id}c`}>
            <path d={LOGO_SHAPE} />
          </clipPath>
          <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
            <rect width="48" height="48" fill="#fff" />
            <path d={LOGO_SEAMS} stroke="#000" strokeWidth={gap} />
          </mask>
        </defs>
        <g clipPath={`url(#${id}c)`}>
          <g mask={`url(#${id}m)`}>
            {LOGO_PATCHES.map(([points, fill]) => (
              <polygon key={points} points={points} fill={fill} />
            ))}
            <polygon points={LOGO_MINE} fill={mine} />
          </g>
        </g>
      </svg>
      {word && (
        <span className="font-display leading-none font-extrabold tracking-[-0.04em]" style={{ fontSize: Math.round(size * 0.72) }}>
          boundless
        </span>
      )}
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

/**
 * A culture's scene (src/features/culture/scenes.ts): its sky, the air strip along the top and the ground strip with the landmark.
 * Fills its positioned parent. hero: the full sign-in panel. banner: a wide, short header with text on the left,
 * so the scene sits to the right. tile: a small card, cropped around the landmark.
 */
export function CultureScene({ culture, variant = "hero", className = "" }: { culture: Culture; variant?: "hero" | "banner" | "tile"; className?: string }) {
  const s = sceneOf(culture.code);
  const at = variant === "banner" ? "82% 92%" : "50% 92%";
  // hero: full width, height from the drawing's own ratio, so nothing is cropped. The air strip starts under the logo row.
  const fit = variant === "tile" ? "slice" : "meet";
  const air = { hero: "inset-x-0 top-14 h-auto w-full lg:top-16", banner: "top-0 right-0 h-[48%] w-auto", tile: "inset-x-0 top-0 h-[34%] w-full" }[variant];
  const ground = { hero: "inset-x-0 bottom-0 h-auto w-full", banner: "right-0 bottom-0 h-full w-auto", tile: "inset-x-0 bottom-0 h-[62%] w-full" }[variant];
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: `radial-gradient(ellipse 75% 45% at ${at}, ${s.glow}66, transparent 70%), linear-gradient(to bottom, ${s.sky[0]}, ${s.sky[1]} 55%, ${s.sky[2]})` }}
      aria-hidden="true"
    >
      {/* The culture's textile pattern, faint and only in the upper sky, like a woven backdrop. */}
      <span className="bg-pattern absolute inset-0 opacity-[.12] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
      {s.air && (
        <svg viewBox="0 0 400 110" preserveAspectRatio={`${variant === "banner" ? "xMaxYMin" : "xMidYMin"} ${fit}`} className={`absolute ${air}`} dangerouslySetInnerHTML={{ __html: s.air }} />
      )}
      <svg viewBox="0 0 400 136" preserveAspectRatio={`${variant === "banner" ? "xMaxYMax" : "xMidYMax"} ${fit}`} className={`absolute ${ground}`} dangerouslySetInnerHTML={{ __html: groundMarkup(culture) }} />
    </div>
  );
}

/** Anonymous avatar: the author's culture pattern in a circle, with their flag as a badge. */
/** The culture pattern with a flag, or the member's cartoon avatar (src/features/avatar/avatar.ts) with the same flag. */
export function Avatar({ code, size = 40, look }: { code: string; size?: number; look?: unknown }) {
  const c = cultureOf(code);
  const l = look ? parseLook(look) : null;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="block size-full rounded-full ring-1 ring-black/5"
        data-look={l ? "" : undefined}
        style={
          l
            ? lookStyle(l, c.c.soft)
            : { backgroundColor: c.c.primary, backgroundImage: patternUrl(c), backgroundSize: `${Math.round(size * 0.85)}px`, backgroundPosition: "center" }
        }
      />
      <span className="absolute -right-0.5 -bottom-0.5 flex rounded-full bg-white p-[1.5px]">
        <Flag code={code} h={Math.max(12, Math.round(size * 0.38))} round />
      </span>
    </span>
  );
}

/** Member level (points from answers and helpful votes). */
export function LevelBadge({ points, t, className = "" }: { points: number; t: T; className?: string }) {
  const l = levelOf(points);
  return (
    <span className={`inline-flex min-w-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-bold whitespace-nowrap ${className}`} style={{ background: l.color + "1A", color: `color-mix(in oklab, ${l.color} 40%, black)` }}>
      <Icon name="sparkles" size={11} className="shrink-0" />
      <span className="truncate">{t(l.ko)}</span>
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
      <Badge variant={deal.id === "done" ? "neutral" : deal.id === "reserved" ? "warning" : "success"} label={t(label)} />
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

// Seoul Metro line colors. Each section of the app is a station on its own line, signed like the real ones:
// a round line number beside the station name. Line 9's gold is left out (white digits would not read on it).
const METRO = ["", "#0052A4", "#00A84D", "#EF7C1C", "#00A5DE", "#996CAC", "#CD7C2F", "#747F00", "#E6186C"]; // index = line number

export function LineBadge({ n, size = 28 }: { n: number; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-white tabular-nums ring-2 ring-white/80"
      style={{ background: METRO[n], width: size, height: size, fontSize: Math.round(size * 0.55) }}
    >
      {n}
    </span>
  );
}

/** Page banner: soft culture color with the member's pattern fading in from the right, and the section's line badge. */
/**
 * Copy of two or more sentences: each sentence is kept whole on a line when it fits, so a line never ends with the
 * first word of the next sentence ("… 둘러볼 수 있어요. 모든 / 데이터는 가상이에요."). Sentences end at . ! ? । before
 * a space, or right after 。！？ (Chinese and Japanese have no spaces); "2.5kg" or "U.S." stay together.
 */
export function Sentences({ text }: { text: string }) {
  const parts = text.split(/(?<=[.!?।])\s+|(?<=[。！？])/).filter(Boolean);
  if (parts.length < 2) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="inline-block max-w-full">{part}</span>
        </Fragment>
      ))}
    </>
  );
}

export function PageHead({ line, title, desc, children }: { line?: number; title: string; desc?: string; children?: ReactNode }) {
  return (
    // Phones: a compact banner (about 120px) so the page's content starts on the first screen.
    <header className="relative overflow-hidden bg-soft px-4 pt-4 pb-5 md:mx-4 md:mt-6 md:rounded-3xl md:px-8 md:pt-8 md:pb-9">
      <span
        className="bg-pattern absolute inset-y-0 right-0 w-2/5 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
        style={{ backgroundColor: "var(--c-primary)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex items-center gap-2.5 md:gap-3">
          {line && <LineBadge n={line} size={30} />}
          <h1 className="min-w-0 font-display text-2xl leading-tight font-extrabold tracking-tight text-balance md:text-4xl">{title}</h1>
        </div>
        {desc && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed opacity-80 md:mt-2 md:text-[15px]">
            <Sentences text={desc} />
          </p>
        )}
        {children}
      </div>
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-4 pt-3 md:pt-5">
      <Button href={href} label={label} variant="ghost" size="sm" icon={<Icon name="back" size={18} />} className="-ml-2" />
    </div>
  );
}

/**
 * Empty or blocked state on Astryx: EmptyState in a muted card, or an error Banner.
 * A string body becomes the description; anything richer (links, buttons) sits below it.
 */
export function Notice({
  tone = "info",
  label,
  title,
  icon = "sparkles",
  children,
}: {
  tone?: "info" | "error";
  label?: string;
  title: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  if (tone === "error") return <Banner status="error" title={title} description={children} collapsible={false} />;
  const text = typeof children === "string" ? children : undefined;
  return (
    <Card variant="muted" className="border border-dashed border-[var(--color-border-emphasized)]">
      {label && <StationLabel className="mb-1 justify-center text-primary">{label}</StationLabel>}
      <EmptyState
        title={title}
        description={text}
        icon={
          <span className="flex size-12 items-center justify-center rounded-full bg-soft text-primary">
            <Icon name={icon} size={24} />
          </span>
        }
        actions={text ? undefined : children}
        isCompact
      />
    </Card>
  );
}

/** Countries that solved a question: the asker's first, then those of the neighbors who answered. */
const solvedBy = (p: Pick<PostRow, "nationality" | "helpers">) => [...new Set([p.nationality, ...(p.helpers ?? [])])];

/** "Solved", told as neighbors from different countries working it out together. */
export function SolvedBadge({ post, t, className = "" }: { post: Pick<PostRow, "nationality" | "helpers">; t: T; className?: string }) {
  const all = solvedBy(post);
  const together = !!post.helpers?.length;
  return (
    <Badge
      variant="success"
      className={className}
      icon={
        together ? (
          <span className="flex -space-x-1" aria-hidden="true">
            {all.slice(0, 4).map((c) => (
              <Flag key={c} code={c} h={12} round className="ring-1 ring-white" />
            ))}
          </span>
        ) : (
          <Icon name="check" size={12} />
        )
      }
      label={!together ? t("해결됨") : all.length > 1 ? t("{n}개국 이웃이 함께 해결", { n: all.length }) : t("이웃과 함께 해결")}
    />
  );
}

/** Under a solved question: who solved it, by country, and a nudge to thank them or write the answer down. */
export function SolvedNote({ post, lang, t }: { post: Pick<PostRow, "nationality" | "helpers">; lang: Lang; t: T }) {
  const all = solvedBy(post);
  const together = !!post.helpers?.length;
  const names = all.map((c) => countryName(c, lang)).join(" · ");
  return (
    <div role="note" className="mt-4">
      <Banner
        status="success"
        collapsible={false}
        icon={
          <span className="flex shrink-0 -space-x-2" aria-hidden="true">
            {/* Three faces on phones, five on wider screens, so the country list keeps room to read. */}
            {all.slice(0, 5).map((c, i) => (
              <span key={c} className={i > 2 ? "max-sm:hidden" : ""}>
                <Avatar code={c} size={30} />
              </span>
            ))}
          </span>
        }
        title={
          !together
            ? t("글쓴이가 해결됐다고 표시한 질문이에요")
            : all.length > 1
              ? t("{countries}, {n}개국 이웃이 국경을 넘어 함께 해결했어요", { countries: names, n: all.length })
              : t("{country} 이웃끼리 서로 도와 해결했어요", { country: names })
        }
        description={together ? t("도움이 된 답변에 ‘도움돼요’를 눌러 고마움을 전해 보세요.") : t("어떻게 해결했는지 댓글로 남기면 다음 이웃에게 큰 도움이 돼요.")}
      />
    </div>
  );
}


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
      {/* One line on every screen: who and where on the left (it clips before it wraps), the time pinned right.
          The level badge waits for wider screens when the board also has to fit. */}
      <div className="flex items-center gap-x-1.5 text-[13px] whitespace-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-x-1.5 overflow-hidden">
          {showBoard ? (
            <>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: board.color }}>
                <Icon name={board.icon} size={11} />
              </span>
              <span className="min-w-0 truncate font-bold">{t(board.ko)}</span>
              <span className="mx-0.5 h-3 w-px shrink-0 bg-current opacity-25" aria-hidden="true" />
              <Flag code={post.nationality} h={11} />
            </>
          ) : (
            <Avatar code={post.nationality} size={22} look={post.avatar} />
          )}
          {/* When the line runs out, the country gives way first, then the level, then the region; each ends in an ellipsis. */}
          <span className={`min-w-0 shrink-[100] truncate ${showBoard ? "" : "font-bold"}`}>{t("{country} 이웃", { country: countryName(post.nationality, lang) })}</span>
          <LevelBadge points={post.points} t={t} className={`shrink-[10] ${showBoard ? "max-sm:hidden" : ""}`} />
          {post.following && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-ink px-1.5 py-px text-[11px] font-bold whitespace-nowrap text-white">
              <Icon name="following" size={11} />
              {t("팔로잉")}
            </span>
          )}
          {/* The region is how readers judge whether an answer applies to them, so it stands out from the time. */}
          {post.region && (
            <span className="inline-flex min-w-0 items-center gap-0.5 font-bold">
              <Icon name="pin" size={12} className="shrink-0 text-primary" />
              <span className="truncate">{regionLabel(post.region, t)}</span>
            </span>
          )}
          {waiting && post.bumped_at && (
            <Badge variant="warning" icon={<Icon name="lift" size={12} />} label={t("도움 요청")} />
          )}
        </div>
        <time dateTime={new Date(post.created_at).toISOString()} className="shrink-0 opacity-70">
          {timeAgo(post.created_at, lang)}
        </time>
      </div>

      <div className="mt-2 flex gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] leading-snug font-bold [overflow-wrap:anywhere] md:text-lg">
            <Link href={`/posts/${post.id}`} className="after:absolute after:inset-0 after:z-10 group-hover:underline">
              <TagText board={post.topic} tagId={post.kind} t={t} />
              {post.title}
            </Link>
          </h2>
          {(board.extra === "market" || board.extra === "event") && (
            <div className="mt-1.5">{board.extra === "market" ? <MarketLine post={post} t={t} /> : <EventLine post={post} t={t} />}</div>
          )}
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed opacity-75 [overflow-wrap:anywhere]">{post.body}</p>
        </div>
        {post.image && (
          <Image
            src={`/api/img/${post.image}`}
            alt=""
            width={88}
            height={88}
            unoptimized
            className="size-[72px] shrink-0 rounded-xl bg-ink/5 object-cover ring-1 ring-ink/10 md:size-[88px]"
          />
        )}
      </div>

      {post.top_answer && (
        <div className="mt-3 flex gap-2.5 border-l-2 border-primary/40 pl-3">
          <Avatar code={post.top_answer.nationality} size={22} />
          <p className="line-clamp-2 min-w-0 text-[13px] leading-relaxed [overflow-wrap:anywhere]">
            <span className="mr-1 font-bold whitespace-nowrap text-primary">{post.top_answer.accepted ? t("채택된 답변") : t("가장 도움된 답변")}</span>
            <span className="opacity-80">{post.top_answer.body}</span>
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold">
        <form action={toggleLike} className="relative z-20">
          <input type="hidden" name="post" value={post.id} />
          <Button
            type="submit"
            size="sm"
            variant={post.liked ? "primary" : "secondary"}
            aria-pressed={post.liked}
            label={`${t("도움돼요")} ${post.likes}`}
            icon={<Icon name="helpful" size={15} />}
            className="rounded-full"
          >
            {post.likes}
          </Button>
        </form>
        <span className={`${action} bg-ink/[.05]`} aria-label={`${t("댓글")} ${post.comments}`}>
          <Icon name="comment" size={15} />
          {post.comments}
        </span>
        <span className={`${action} px-2 font-medium opacity-70`} aria-label={t("조회 {n}", { n: post.views })}>
          <Icon name="eye" size={15} />
          {post.views}
        </span>
        <span className={`${action} px-2 font-medium opacity-70`} title={t("원문")}>
          <Icon name="globe" size={13} />
          {langAutonym(post.lang, lang)}
        </span>
        {post.solved ? (
          <SolvedBadge post={post} t={t} className="ml-auto" />
        ) : (
          // On my own question "Answer →" reads like an instruction to myself; say it is waiting instead.
          waiting && (post.mine ? <span className="ml-auto whitespace-nowrap opacity-70">{t("답변 대기")}</span> : <span className="ml-auto font-bold whitespace-nowrap text-primary">{t("답변하기")}</span>)
        )}
      </div>
    </article>
  );
}

export function SignInRequired({ t, next, title, desc }: { t: T; next: string; title?: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-3xl p-4 md:pt-8">
      <Card className="border-l-4 border-l-primary bg-soft/60">
        <StationLabel className="text-primary">{t("로그인 필요")}</StationLabel>
        <p className="mt-1.5 font-display text-lg font-bold">{title ?? t("로그인하면 볼 수 있어요")}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{desc ?? t("이 정보는 내 계정에서만 보여요.")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={`/login?next=${encodeURIComponent(next)}`} label={t("로그인")} variant="primary" size="lg" />
          <Button href="/#demo" label={t("샘플 계정으로 체험")} variant="secondary" size="lg" />
        </div>
      </Card>
    </div>
  );
}

/** One official hotline or website. External links open in a new tab. */
/** One official contact as a small pill: number (or a link icon) and name; the description is the tooltip. */
export function HelpChip({ h, t }: { h: Help; t: T }) {
  return (
    <a
      href={h.tel ? `tel:${h.tel}` : h.url}
      {...(h.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      title={t(h.desc)}
      className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background-card)] px-3 text-sm transition hover:border-primary/40"
    >
      <Icon name={h.tel ? "phone" : "external"} size={13} className="shrink-0 text-primary" />
      {h.tel && <b className="font-display whitespace-nowrap text-primary">{h.tel}</b>}
      <span className="truncate">{t(h.name)}</span>
    </a>
  );
}

export function HelpItem({ h, t }: { h: Help; t: T }) {
  const href = h.tel ? `tel:${h.tel}` : h.url;
  return (
    <a
      href={href}
      {...(h.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`flex flex-wrap items-start rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-card)] gap-x-3 gap-y-2 p-3.5 transition hover:border-primary/40`}
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
