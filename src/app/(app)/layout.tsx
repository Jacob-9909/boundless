import Link from "next/link";
import type { CSSProperties } from "react";
import { setLang } from "@/app/actions";
import { BottomNav } from "@/components/BottomNav";
import { DemoSwitch } from "@/components/Community";
import { Icon } from "@/components/Icon";
import { SideNav, type NavItem } from "@/components/SideNav";
import { Avatar, Flag, Logo, btn } from "@/components/ui";
import { canViewQueue, demoEnabled, getT, getUser } from "@/lib/auth";
import { cultureOf, DEFAULT_CULTURE, themeVars } from "@/lib/cultures";
import { countryName, TOPICS } from "@/lib/i18n";
import { topicCounts, unreadCount } from "@/lib/posts";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  // A member sees the app in their own culture's colors; visitors see the neutral Boundless theme.
  const culture = user ? cultureOf(user.nationality) : DEFAULT_CULTURE;
  const [unread, counts] = await Promise.all([user ? unreadCount(user.id, user.seen_at) : 0, topicCounts()]);
  const demoUser = !!user && demoEnabled() && user.email.endsWith("@example.com");
  const other = lang === "ko" ? "en" : "ko";

  const nav: NavItem[] = [
    { href: "/feed", icon: "home", label: t("피드") },
    { href: "/search", icon: "search", label: t("검색") },
    { href: "/guide", icon: "info", label: t("공식 안내") },
    { href: "/me", icon: "file", label: t("내 글"), badge: unread },
    { href: "/settings", icon: "sliders", label: t("설정") },
    ...(canViewQueue(user) ? [{ href: "/admin", icon: "flag" as const, label: t("운영 큐") }] : []),
  ];

  return (
    <div style={themeVars(culture) as CSSProperties} className="min-h-screen bg-paper text-ink">
      <a href="#main" className="skip-link rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">
        {t("본문으로 건너뛰기")}
      </a>
      <div className="mx-auto flex max-w-[1360px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-ink/[.07] bg-white/70 px-4 py-5 backdrop-blur lg:flex">
          <Link href="/?intro=1" className="px-2 text-ink" aria-label="Boundless">
            <Logo />
          </Link>
          <SideNav items={nav} />
          <Link href="/write" className={`${btn} w-full`}>
            <Icon name="plus" size={18} />
            {t("글쓰기")}
          </Link>

          <div>
            <p className="station-label mb-1 px-3 opacity-50">{t("주제 노선")}</p>
            <ul>
              {TOPICS.map((tp) => (
                <li key={tp.id}>
                  <Link href={`/feed?topic=${tp.id}`} className="flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-ink/80 hover:bg-ink/[.05]">
                    <span className="size-3 rounded-full ring-2 ring-white" style={{ background: tp.color }} />
                    {t(tp.ko)}
                    <span className="ml-auto text-xs opacity-50">{counts.find((c) => c.topic === tp.id)?.n ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto space-y-3">
            {user ? (
              <div className="overflow-hidden rounded-2xl border border-ink/[.07] bg-white">
                <div className="bg-pattern h-10 bg-primary" aria-hidden="true" />
                <div className="-mt-5 px-3 pb-3">
                  <Avatar code={user.nationality} size={40} />
                  <p className="mt-1.5 text-sm font-bold">{t("이웃")}</p>
                  <p className="flex items-center gap-1.5 text-xs opacity-70">
                    <Flag code={user.nationality} h={11} />
                    {countryName(user.nationality, lang)}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug opacity-50">{culture.motif[lang]}</p>
                  {demoUser && (
                    <details className="mt-2 rounded-xl bg-paper p-2">
                      <summary className="cursor-pointer text-xs font-bold text-primary">{t("샘플 계정 바꾸기")}</summary>
                      <div className="mt-2">
                        <DemoSwitch t={t} lang={lang} current={user.nationality} compact />
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/[.07] bg-white p-3">
                <p className="text-sm font-bold">{t("로그인하고 질문해 보세요")}</p>
                <p className="mt-0.5 text-xs opacity-60">{t("국적 하나만 공개돼요. 이메일은 비공개.")}</p>
                <Link href="/login" className={`${btn} mt-3 h-10 w-full text-sm`}>
                  {t("로그인")}
                </Link>
                <Link href="/#demo" className="mt-2 block text-center text-xs font-bold text-primary hover:underline">
                  {t("샘플 계정으로 체험")}
                </Link>
              </div>
            )}
            <form action={setLang.bind(null, other)}>
              <button className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-ink/70 hover:bg-ink/[.05]" aria-label={t("화면 언어 바꾸기")}>
                <Icon name="globe" size={16} />
                {lang === "ko" ? "한국어 → English" : "English → 한국어"}
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-12">
          {/* Phone / tablet header */}
          <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <Link href="/feed" className="mr-auto text-ink" aria-label="Boundless">
                <Logo />
              </Link>
              <form action={setLang.bind(null, other)}>
                <button className="inline-flex h-9 items-center gap-1 rounded-full border border-ink/15 bg-white px-3 text-[13px] font-bold" aria-label={t("화면 언어 바꾸기")}>
                  <Icon name="globe" size={16} />
                  {lang.toUpperCase()}
                </button>
              </form>
              {user ? (
                <Link href="/settings" className="inline-flex h-9 items-center rounded-full bg-soft px-1.5" title={t("내 공개 국적")} aria-label={t("내 공개 국적")}>
                  <Avatar code={user.nationality} size={26} />
                </Link>
              ) : (
                <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[13px] font-bold text-paper">
                  {t("로그인")}
                </Link>
              )}
            </div>
            {user && <div className="bg-pattern h-1.5 bg-primary bg-[length:auto_24px]" aria-hidden="true" />}
          </header>
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
        </div>
      </div>
      <div className="lg:hidden">
        <BottomNav labels={{ feed: t("피드"), search: t("검색"), me: t("내 글"), guide: t("안내"), settings: t("설정") }} unread={unread} />
      </div>
    </div>
  );
}
