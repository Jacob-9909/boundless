import Link from "next/link";
import { demoLogin } from "@/app/actions";
import { CULTURES } from "@/lib/cultures";
import { HOTLINES } from "@/lib/guide";
import { countryName, timeAgo, type Lang, type T } from "@/lib/i18n";
import { communityStats, hotPosts, listPosts, nationalityCounts, recentActivity } from "@/lib/posts";
import { Icon } from "./Icon";
import { Avatar, Flag, card } from "./ui";

const railTitle = "flex items-center gap-1.5 text-sm font-extrabold";

/** Right-hand column: who is here, what needs an answer, what is popular, what just happened. */
export async function RightRail({ viewer, lang, t }: { viewer: string | null; lang: Lang; t: T }) {
  const [stats, counts, waiting, hot, activity] = await Promise.all([
    communityStats(),
    nationalityCounts(),
    listPosts(viewer, { waiting: true, limit: 4 }),
    hotPosts(viewer),
    recentActivity(viewer),
  ]);
  return (
    <div className="space-y-4">
      <section className={`${card} p-4`}>
        <p className={railTitle}>
          <Icon name="users" size={16} className="text-primary" />
          {t("{n}개국에서 온 이웃", { n: stats.countries })}
        </p>
        <p className="mt-0.5 text-xs opacity-60">{t("글 {posts}개 · 답변 {answers}개", { posts: stats.posts, answers: stats.answers })}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {counts.map((c) => (
            <li key={c.nationality}>
              <Link
                href={`/search?from=${c.nationality}`}
                title={t("{country} 이웃의 글", { country: countryName(c.nationality, lang) })}
                aria-label={t("{country} 이웃의 글", { country: countryName(c.nationality, lang) })}
                className="flex items-center gap-1 rounded-full bg-paper py-0.5 pr-2 pl-0.5 text-xs font-bold transition hover:bg-soft"
              >
                <Avatar code={c.nationality} size={24} />
                {c.n}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {waiting.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <Icon name="comment" size={16} className="text-extra" />
            {t("답변을 기다리는 질문")}
          </p>
          <ul className="mt-2 divide-y divide-ink/[.06]">
            {waiting.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="flex items-start gap-2.5 py-2.5 hover:opacity-80">
                  <Avatar code={p.nationality} size={26} />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] leading-snug font-bold">{p.title}</span>
                    <span className="text-xs text-primary">{t("답변하기")} →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hot.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <Icon name="flame" size={16} className="text-extra" />
            {t("이번 주 인기 글")}
          </p>
          <ol className="mt-2 space-y-2">
            {hot.map((p, i) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                  <span className="w-4 font-display text-base font-extrabold text-extra">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{p.title}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs opacity-60">
                    <Icon name="helpful" size={13} />
                    {p.likes}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {activity.length > 0 && (
        <section className={`${card} p-4`}>
          <p className={railTitle}>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t("최근 활동")}
          </p>
          <ul className="mt-2 space-y-3">
            {activity.map((a) => (
              <li key={a.id}>
                <Link href={`/posts/${a.post_id}`} className="flex gap-2.5 hover:opacity-80">
                  <Avatar code={a.nationality} size={26} />
                  <span className="min-w-0 text-xs leading-relaxed">
                    <span className="font-bold">{t("{country} 이웃이 답했어요", { country: countryName(a.nationality, lang) })}</span>
                    <span className="opacity-50"> · {timeAgo(a.created_at, lang)}</span>
                    <span className="block truncate opacity-70">“{a.body}”</span>
                    <span className="block truncate opacity-50">{a.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${card} p-4`}>
        <div className="flex items-center justify-between">
          <p className={railTitle}>
            <Icon name="phone" size={16} className="text-primary" />
            {t("공식 안내")}
          </p>
          <Link href="/guide" className="text-xs opacity-60 hover:underline">
            {t("전체 보기")}
          </Link>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5">
          {HOTLINES.slice(0, 4).map((h) => (
            <li key={h.tel}>
              <a href={`tel:${h.tel}`} className="block rounded-xl bg-paper px-2.5 py-2 hover:bg-soft">
                <span className="block font-display text-sm font-extrabold text-primary">{h.tel}</span>
                <span className="block truncate text-[11px] opacity-70">{h.name[lang]}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Buttons that enter as a country's sample neighbor (judges, demos). */
export function DemoSwitch({ t, lang, current, compact = false }: { t: T; lang: Lang; current?: string; compact?: boolean }) {
  const codes = [...CULTURES.map((c) => c.code), "XX"];
  return (
    <ul className={`grid gap-1.5 ${compact ? "grid-cols-8" : "grid-cols-4 sm:grid-cols-8"}`}>
      {codes.map((code) => {
        const flag = code === "XX" ? "CA" : code;
        const name = code === "XX" ? t("그 밖의 나라 (캐나다)") : countryName(code, lang);
        return (
          <li key={code}>
            <form action={demoLogin.bind(null, code)}>
              <button
                title={name}
                aria-label={t("{country} 샘플 계정으로 입장", { country: name })}
                className={`flex w-full items-center justify-center rounded-lg border p-1.5 transition hover:border-primary ${current === flag ? "border-primary bg-soft" : "border-ink/10 bg-white"}`}
              >
                <Flag code={flag} h={compact ? 12 : 16} />
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
