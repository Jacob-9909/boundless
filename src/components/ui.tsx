import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cultureOf, patternUrl } from "@/lib/cultures";
import type { Help } from "@/lib/guide";
import { countryName, kindLabel, langAutonym, regionLabel, timeAgo, topicColor, topicLabel, type Lang, type T } from "@/lib/i18n";
import type { PostRow } from "@/lib/posts";
import { Icon } from "./Icon";

/* Design tokens. Radius: containers 16-24px, controls 12px, tags 6px, pills full.
   Height: controls 44px (h-11), compact actions 36px (h-9). Type: body 15px, meta 13px, tags 12px. */
export const card = "rounded-2xl border border-ink/[.07] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]";
export const btn =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-[15px] font-bold text-paper transition hover:brightness-110 active:scale-[.98] disabled:opacity-50";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white px-5 text-[15px] font-bold text-primary transition hover:border-primary/40";
export const pill = "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold transition";
export const tag = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold";
export const field =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
export const labelCls = "mb-1.5 block text-sm font-bold";

/** Seoul subway line colors: the brand's "many lines, one network" motif. */
export const LINES = ["#0052A4", "#00A84D", "#EF7C1C", "#00A5DE", "#996CAC", "#E6186C", "#CD7C2F", "#747F00"];

/** Mark: three colored lines run through a dashed border and out the other side. */
export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight ${className}`}>
      <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity=".7" />
        <path d="M3 19 L19 3" stroke={LINES[1]} strokeWidth="3" strokeLinecap="round" />
        <path d="M6 24 L25 5" stroke={LINES[2]} strokeWidth="3" strokeLinecap="round" />
        <path d="M11 26 L26 11" stroke={LINES[3]} strokeWidth="3" strokeLinecap="round" />
      </svg>
      BOUNDLESS
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

/** A topic drawn as a subway line badge. */
export function TopicBadge({ id, t, href }: { id: string; t: T; href?: string }) {
  const inner = (
    <>
      <span className="size-2.5 rounded-full ring-2 ring-white" style={{ background: topicColor(id) }} />
      {topicLabel(id, t)}
    </>
  );
  const cls = "inline-flex items-center gap-1.5 rounded-full bg-ink/[.05] px-2.5 py-0.5 text-xs font-semibold";
  return href ? (
    <Link href={href} className={`${cls} hover:bg-ink/10`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/** Self-declared nationality, colored with that culture's palette. */
export function NationalityChip({ code, lang, prefix }: { code: string; lang: Lang; prefix?: string }) {
  const c = cultureOf(code).c;
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1.5 text-xs font-semibold"
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
export function PageHead({ line, title, desc }: { line: string; title: string; desc?: string }) {
  return (
    <header className="relative overflow-hidden bg-soft px-5 pt-6 pb-7 md:mx-4 md:mt-6 md:rounded-3xl md:px-8 md:pt-8 md:pb-9">
      <span
        className="bg-pattern absolute inset-y-0 right-0 w-2/5 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
        style={{ backgroundColor: "var(--c-primary)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <StationLabel className="text-primary">{line}</StationLabel>
        <h1 className="mt-2 font-display text-[28px] leading-tight font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {desc && <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-80 md:text-[15px]">{desc}</p>}
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
      {children && <div className="mt-1 text-sm leading-relaxed opacity-80">{children}</div>}
    </div>
  );
}

export function Stat({ icon, n, label }: { icon: "helpful" | "comment"; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${label} ${n}`}>
      <Icon name={icon} size={15} />
      {n}
    </span>
  );
}

/** Feed card: who asked (anonymous + culture), what, and the most helpful answer so far. */
export function PostCard({ post, lang, t }: { post: PostRow; lang: Lang; t: T }) {
  const waiting = post.kind === "question" && post.comments === 0 && !post.solved;
  return (
    <Link href={`/posts/${post.id}`} className={`${card} group block p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(16,24,40,.25)] md:p-5`}>
      <div className="flex gap-3">
        <Avatar code={post.nationality} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="font-bold">{t("이웃")}</span>
            <span className="truncate opacity-60">
              · {countryName(post.nationality, lang)}
              {post.region && ` · ${regionLabel(post.region, t)}`}
            </span>
            <span className="ml-auto shrink-0 opacity-50">{timeAgo(post.created_at, lang)}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`${tag} ${post.kind === "question" ? "bg-primary text-paper" : "bg-soft text-ink"}`}>{kindLabel(post.kind, t)}</span>
            <TopicBadge id={post.topic} t={t} />
            <span className={`${tag} bg-ink/[.05]`} title={t("원문")}>
              <Icon name="globe" size={12} />
              {langAutonym(post.lang, lang)}
            </span>
            {post.solved && (
              <span className={`${tag} bg-emerald-700 text-white`}>
                <Icon name="check" size={12} />
                {t("해결됨")}
              </span>
            )}
            {waiting && <span className={`${tag} border border-extra/40 text-extra`}>{t("답변을 기다려요")}</span>}
          </div>
          <h3 className="mt-2.5 font-display text-[17px] leading-snug font-bold [overflow-wrap:anywhere] group-hover:underline md:text-lg">{post.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed opacity-70 [overflow-wrap:anywhere]">{post.body}</p>

          {post.top_answer && (
            <div className="mt-3 flex gap-2.5 rounded-xl bg-paper p-3">
              <Avatar code={post.top_answer.nationality} size={24} />
              <p className="line-clamp-2 min-w-0 text-[13px] leading-relaxed [overflow-wrap:anywhere]">
                <span className="mr-1 font-bold text-primary">{t("가장 도움된 답변")}</span>
                <span className="opacity-80">{post.top_answer.body}</span>
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-[13px]">
            <span className="flex items-center gap-4 opacity-60">
              <Stat icon="helpful" n={post.likes} label={t("도움돼요")} />
              <Stat icon="comment" n={post.comments} label={t("댓글")} />
            </span>
            {waiting && <span className="ml-auto font-bold text-primary">{t("답변하기")} →</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SignInRequired({ t, next }: { t: T; next: string }) {
  return (
    <div className="mx-auto max-w-3xl p-4 md:pt-8">
      <div className="rounded-2xl border-l-4 border-primary bg-soft/60 p-5">
        <StationLabel className="text-primary">{t("로그인 필요")}</StationLabel>
        <p className="mt-1.5 font-display text-lg font-bold">{t("로그인하면 볼 수 있어요")}</p>
        <p className="mt-1 text-sm opacity-80">{t("이 정보는 내 계정에서만 보여요.")}</p>
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
export function HelpItem({ h, lang, t }: { h: Help; lang: Lang; t: T }) {
  const href = h.tel ? `tel:${h.tel}` : h.url;
  return (
    <a
      href={href}
      {...(h.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${card} flex items-start gap-3 p-3.5 transition hover:border-primary/40`}
    >
      <span
        className={`flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 font-display text-sm font-extrabold ${h.tel ? "bg-primary text-paper" : "bg-soft text-primary"}`}
      >
        <Icon name={h.tel ? "phone" : "external"} size={14} />
        {h.tel}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{h.name[lang]}</span>
        <span className="mt-0.5 block text-xs leading-relaxed opacity-75">{t(h.desc)}</span>
        {h.url && <span className="mt-0.5 block truncate text-xs text-primary">{h.url.replace("https://", "")}</span>}
      </span>
    </a>
  );
}
