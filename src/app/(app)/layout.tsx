import Link from "next/link";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { cultureFonts } from "@/app/login/fonts";
import { BottomNav } from "@/components/BottomNav";
import { AccountSwitcher } from "@/components/Community";
import { TextField } from "@/components/fields";
import { Icon } from "@/components/Icon";
import { LangMenu } from "@/components/LangMenu";
import { AppSideNav, type NavItem } from "@/components/SideNav";
import { Avatar, Flag, LevelBadge, Logo } from "@/components/ui";
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
  const langNote = t("한국어와 영어 밖의 언어는 기계 번역이라 어색한 문장이 있을 수 있어요. 검수하고 있어요.");

  const main: NavItem[] = [
    { href: "/feed", icon: "home", label: t("홈") },
    { href: "/lounge", icon: "users", label: user ? t("{country} 라운지", { country: countryName(user.nationality, lang) }) : t("우리나라 라운지") },
    { href: "/search", icon: "search", label: t("검색") },
    { href: "/me", icon: "file", label: t("내 글"), badge: unread },
  ];
  const more: NavItem[] = [
    { href: "/guide", icon: "info", label: t("공식 안내") },
    { href: "/settings", icon: "sliders", label: t("설정") },
    ...(canViewQueue(user) ? [{ href: "/admin", icon: "siren" as const, label: t("운영 큐") }] : []),
  ];
  const boards = GROUPS.map((gr) => ({
    label: t(gr.ko),
    items: BOARDS.filter((b) => b.group === gr.id).map((b) => {
      const today = counts.find((x) => x.topic === b.id)?.today ?? 0;
      return { href: `/b/${b.id}`, label: t(b.ko), icon: b.icon, color: b.color, today, todayText: t("새 글 {n}", { n: today }) };
    }),
  }));

  const topNav = (
    <TopNav
      label={t("상단 메뉴")}
      heading={<TopNavHeading logo={<Logo word={false} size={28} />} heading="boundless" headingHref="/feed" />}
      centerContent={
        // Desktop: search sits in the bar like any community site. Phones get the icon below instead.
        <form action="/search" role="search" className="w-full max-w-md max-lg:hidden">
          <TextField name="q" type="search" label={t("검색")} isLabelHidden placeholder={t("검색어를 입력하세요")} startIcon="search" width="100%" />
        </form>
      }
      endContent={
        <div className="flex items-center gap-2">
          <IconButton href="/search" label={t("검색")} icon={<Icon name="search" size={18} />} variant="ghost" className="lg:hidden" />
          <LangMenu lang={lang} label={t("화면 언어 바꾸기")} note={langNote} compact />
          {user ? (
            <Link href="/settings" className="inline-flex size-10 items-center justify-center rounded-full ring-1 ring-[var(--color-border)] transition hover:ring-[var(--color-border-emphasized)]" title={t("내 공개 국적")} aria-label={t("내 공개 국적")}>
              <Avatar code={user.nationality} size={32} look={user.avatar} />
            </Link>
          ) : (
            <Button href="/login" label={t("로그인")} variant="primary" />
          )}
        </div>
      }
    />
  );

  const footer = (
    <div className="space-y-2">
      {user ? (
        <Link
          href={user.avatar ? "/settings" : "/settings/avatar"}
          title={t("내 프로필")}
          className="block overflow-hidden rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-card)] transition hover:border-[var(--color-border-emphasized)]"
        >
          <div className="bg-pattern h-1.5 bg-primary bg-[length:auto_24px]" aria-hidden="true" />
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Avatar code={user.nationality} size={36} look={user.avatar} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <Flag code={user.nationality} h={11} />
                <span className="truncate">{countryName(user.nationality, lang)}</span>
              </p>
              {points && <LevelBadge points={points.points} t={t} />}
              {!user.avatar && <p className="mt-0.5 text-xs font-bold text-primary">{t("아바타 만들기")} ›</p>}
            </div>
          </div>
        </Link>
      ) : (
        <div className="rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-card)] p-3">
          <p className="text-sm font-bold">{t("로그인하고 이야기해 보세요")}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{t("국적 하나만 공개돼요. 이메일은 비공개.")}</p>
          <Button href="/login" label={t("로그인")} variant="primary" width="100%" className="mt-3" />
          <Button href="/#demo" label={t("샘플 계정으로 체험")} variant="ghost" size="sm" width="100%" className="mt-1" />
        </div>
      )}
      {demoUser && user && <AccountSwitcher t={t} lang={lang} current={user.nationality} />}
      <p className="px-1 text-[11px] text-[var(--color-text-secondary)]">
        <Link href="/policy" className="hover:underline">
          {t("운영 정책")}
        </Link>
        {" · © 2026 Boundless · "}
        {t("버전")} {process.env.APP_BUILD}
      </p>
    </div>
  );

  return (
    <div style={themeVars(culture)} className={`culture ${cultureFonts} min-h-dvh bg-paper text-ink`}>
      <AppShell
        height="auto"
        variant="section"
        mobileNav={{ breakpoint: "lg" }}
        // The member's culture pattern as a thin strip over the bar: you are in your own country's colors.
        banner={user ? <div className="bg-pattern h-1.5 bg-primary bg-[length:auto_24px]" aria-hidden="true" /> : undefined}
        topNav={topNav}
        sideNav={
          <AppSideNav
            label={t("주요 메뉴")}
            main={main}
            boards={boards}
            moreLabel={t("더 보기")}
            more={more}
            topContent={<Button href="/write" label={t("글쓰기")} variant="primary" size="lg" width="100%" icon={<Icon name="plus" size={18} />} />}
            footer={footer}
          />
        }
      >
        <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">{children}</div>
      </AppShell>
      <div className="lg:hidden">
        <BottomNav labels={{ feed: t("홈"), boards: t("게시판"), lounge: t("라운지"), me: t("내 글"), settings: t("설정") }} unread={unread} />
      </div>
    </div>
  );
}
