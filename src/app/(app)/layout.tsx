import Link from "next/link";
import type { CSSProperties } from "react";
import { cultureFonts } from "@/app/login/fonts";
import { BottomNav } from "@/components/BottomNav";
import { AccountSwitcher } from "@/components/Community";
import { Icon } from "@/components/Icon";
import { LangMenu } from "@/components/LangMenu";
import { SideNav, type NavItem } from "@/components/SideNav";
import { Avatar, Flag, LevelBadge, Logo, btn } from "@/components/ui";
import { canViewQueue, demoEnabled, getT, getUser } from "@/lib/auth";
import { BOARDS, GROUPS } from "@/lib/boards";
import { cultureOf, DEFAULT_CULTURE, themeVars } from "@/lib/cultures";
import { countryName } from "@/lib/i18n";
import { boardCounts, myPoints, unreadCount } from "@/lib/posts";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  // A member sees the app in their own culture's colors; visitors see the neutral Seoul theme.
  const culture = user ? cultureOf(user.nationality) : DEFAULT_CULTURE;
  const [unread, counts, points] = await Promise.all([
    user ? unreadCount(user.id, user.seen_at) : 0,
    boardCounts(),
    user ? myPoints(user.id) : Promise.resolve(null),
  ]);
  const demoUser = !!user && demoEnabled() && user.email.endsWith("@example.com");

  const nav: NavItem[] = [
    { href: "/feed", icon: "home", label: t("홈") },
    { href: "/lounge", icon: "users", label: user ? t("{country} 라운지", { country: countryName(user.nationality, lang) }) : t("우리나라 라운지") },
    { href: "/search", icon: "search", label: t("검색") },
    { href: "/me", icon: "file", label: t("내 글"), badge: unread },
  ];
  const navEnd: NavItem[] = [
    { href: "/guide", icon: "info", label: t("공식 안내") },
    { href: "/settings", icon: "sliders", label: t("설정") },
    ...(canViewQueue(user) ? [{ href: "/admin", icon: "flag" as const, label: t("운영 큐") }] : []),
  ];

  return (
    <div style={themeVars(culture) as CSSProperties} className={`${cultureFonts} min-h-screen bg-paper text-ink`}>
      <a href="#main" className="skip-link rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">
        {t("본문으로 건너뛰기")}
      </a>
      <div className="mx-auto flex max-w-[1360px]">
        {/* Desktop sidebar */}
        <div className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-ink/[.07] bg-white/75 backdrop-blur lg:flex">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 pt-5 pb-8 [mask-image:linear-gradient(to_bottom,black_calc(100%-40px),transparent)]">
            <Link href="/?intro=1" className="block px-2 text-ink" aria-label="Boundless">
              <Logo />
            </Link>
            <SideNav items={nav} label={t("주요 메뉴")} />
            <Link href="/write" className={`${btn} w-full`}>
              <Icon name="plus" size={18} />
              {t("글쓰기")}
            </Link>

            {GROUPS.map((gr) => (
              <div key={gr.id}>
                <p className="mb-1 px-3 text-xs font-bold tracking-wide opacity-70">{t(gr.ko)}</p>
                <ul>
                  {BOARDS.filter((b) => b.group === gr.id).map((b) => {
                    const c = counts.find((x) => x.topic === b.id);
                    return (
                      <li key={b.id}>
                        <Link href={`/b/${b.id}`} title={t(b.ko)} className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-sm whitespace-nowrap text-ink/80 hover:bg-ink/[.05]">
                          <span className="flex size-6 items-center justify-center rounded-lg text-white" style={{ background: b.color }}>
                            <Icon name={b.icon} size={13} />
                          </span>
                          <span className="min-w-0 truncate">{t(b.ko)}</span>
                          {!!c?.today && <span className="size-1.5 rounded-full bg-alert" aria-label={t("오늘 새 글")} />}
                          <span className="ml-auto text-xs opacity-70">{c?.n ?? 0}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <SideNav items={navEnd} label={t("더 보기")} />
          </div>

          <div className="space-y-2 border-t border-ink/[.07] p-3">
            {user ? (
              <div className="overflow-hidden rounded-2xl border border-ink/[.07] bg-white">
                <div className="bg-pattern h-1.5 bg-primary bg-[length:auto_24px]" aria-hidden="true" />
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <Avatar code={user.nationality} size={36} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold">
                      <Flag code={user.nationality} h={11} />
                      <span className="truncate">{countryName(user.nationality, lang)}</span>
                    </p>
                    {points && <LevelBadge points={points.points} t={t} />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/[.07] bg-white p-3">
                <p className="text-sm font-bold">{t("로그인하고 이야기해 보세요")}</p>
                <p className="mt-0.5 text-xs opacity-70">{t("국적 하나만 공개돼요. 이메일은 비공개.")}</p>
                <Link href="/login" className={`${btn} mt-3 h-10 w-full text-sm`}>
                  {t("로그인")}
                </Link>
                <Link href="/#demo" className="mt-2 block text-center text-xs font-bold text-primary hover:underline">
                  {t("샘플 계정으로 체험")}
                </Link>
              </div>
            )}
            {demoUser && user && <AccountSwitcher t={t} lang={lang} current={user.nationality} />}
            <LangMenu lang={lang} label={t("화면 언어 바꾸기")} note={t("한국어와 영어 밖의 언어는 기계 번역이라 어색한 문장이 있을 수 있어요. 검수하고 있어요.")} align="left" up />
          </div>
        </div>

        <div className="min-w-0 flex-1 pb-24 lg:pb-12">
          {/* Phone / tablet header */}
          <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <Link href="/feed" className="mr-auto text-ink" aria-label="Boundless">
                <Logo size={26} />
              </Link>
              <LangMenu lang={lang} label={t("화면 언어 바꾸기")} note={t("한국어와 영어 밖의 언어는 기계 번역이라 어색한 문장이 있을 수 있어요. 검수하고 있어요.")} compact />
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
        <BottomNav labels={{ feed: t("홈"), boards: t("게시판"), lounge: t("라운지"), me: t("내 글"), settings: t("설정") }} unread={unread} />
      </div>
    </div>
  );
}
