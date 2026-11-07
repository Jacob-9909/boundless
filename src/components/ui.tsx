import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cultureOf } from "@/lib/cultures";
import type { Help } from "@/lib/guide";
import { countryName, kindLabel, langAutonym, regionLabel, timeAgo, topicLabel, type Lang, type T } from "@/lib/i18n";
import type { PostRow } from "@/lib/posts";
import { Icon } from "./Icon";

/* Design tokens. Radius: containers 16px (rounded-2xl), controls 12px (rounded-xl), tags 6px (rounded-md),
   pills full. Height: controls 44px (h-11), compact actions 36px (h-9). Type: body 15px, meta 13px, tags 12px. */
export const card = "rounded-2xl border border-ink/10 bg-white";
export const btn =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-[15px] font-bold text-paper transition hover:brightness-110 active:scale-[.98] disabled:opacity-50";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white px-5 text-[15px] font-bold text-primary transition hover:border-primary/40";
export const pill = "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold transition";
export const tag = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold";
export const field =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
export const labelCls = "mb-1.5 block text-sm font-bold";

/** Mark: a station on a line that runs out past a dashed border. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="11" cy="15" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M5 21 L23 3" stroke="var(--c-extra)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="11" cy="15" r="3.5" fill="var(--c-paper)" stroke="currentColor" strokeWidth="2" />
      </svg>
      BOUNDLESS
    </span>
  );
}

/** SVG flag (emoji flags render as letters on Windows). */
export function Flag({ code, h = 14, className = "" }: { code: string; h?: number; className?: string }) {
  return (
    <Image
      src={`/flags/${code}.svg`}
      alt=""
      width={Math.round(h * 1.5)}
      height={h}
      unoptimized
      className={`inline-block shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,.1)] ${className}`}
    />
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

export function PageHead({ line, title, desc }: { line: string; title: string; desc?: string }) {
  return (
    <header className="border-b-4 border-primary bg-soft px-4 pt-5 pb-6">
      <StationLabel className="text-primary">{line}</StationLabel>
      <h1 className="mt-1.5 font-display text-[28px] leading-tight font-extrabold tracking-tight">{title}</h1>
      {desc && <p className="mt-1.5 text-sm leading-relaxed opacity-80">{desc}</p>}
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-4 pt-3">
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
      <Icon name={icon} size={14} />
      {n}
    </span>
  );
}

export function PostCard({ post, lang, t }: { post: PostRow; lang: Lang; t: T }) {
  return (
    <Link href={`/posts/${post.id}`} className={`${card} block p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-8px_rgba(0,0,0,.18)]`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`${tag} ${post.kind === "question" ? "bg-primary text-paper" : "bg-soft text-ink"}`}>{kindLabel(post.kind, t)}</span>
        <span className={`${tag} bg-ink/5`}>{topicLabel(post.topic, t)}</span>
        {post.region && (
          <span className={`${tag} bg-ink/5`}>
            <Icon name="pin" size={12} />
            {regionLabel(post.region, t)}
          </span>
        )}
        <span className={`${tag} bg-ink/5`} title={t("원문")}>
          <Icon name="globe" size={12} />
          {langAutonym(post.lang, lang)}
        </span>
        {post.solved ? (
          <span className={`${tag} bg-emerald-700 text-white`}>
            <Icon name="check" size={12} />
            {t("해결됨")}
          </span>
        ) : (
          post.kind === "question" && post.comments === 0 && <span className={`${tag} border border-extra/40 text-extra`}>{t("답변을 기다려요")}</span>
        )}
      </div>
      <h3 className="mt-2.5 font-display text-[17px] leading-snug font-bold [overflow-wrap:anywhere]">{post.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed opacity-75 [overflow-wrap:anywhere]">{post.body}</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <NationalityChip code={post.nationality} lang={lang} />
        <span className="ml-auto flex shrink-0 items-center gap-2.5 opacity-60">
          <Stat icon="helpful" n={post.likes} label={t("도움돼요")} />
          <Stat icon="comment" n={post.comments} label={t("댓글")} />
          <span>{timeAgo(post.created_at, lang)}</span>
        </span>
      </div>
    </Link>
  );
}

export function SignInRequired({ t, next }: { t: T; next: string }) {
  return (
    <div className="p-4">
      <div className="rounded-2xl border-l-4 border-primary bg-soft/60 p-5">
        <StationLabel className="text-primary">{t("로그인 필요")}</StationLabel>
        <p className="mt-1.5 font-display text-lg font-bold">{t("로그인하면 볼 수 있어요")}</p>
        <p className="mt-1 text-sm opacity-80">{t("이 정보는 내 계정에서만 보여요.")}</p>
        <div className="mt-4 flex gap-2">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={btn}>
            {t("로그인")}
          </Link>
          <Link href="/" className={btnGhost}>
            {t("피드로 돌아가기")}
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
