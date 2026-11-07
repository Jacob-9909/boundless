import Link from "next/link";
import type { CSSProperties } from "react";
import { setLang } from "@/app/actions";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Flag, Logo } from "@/components/ui";
import { getT, getUser } from "@/lib/auth";
import { cultureOf, DEFAULT_CULTURE, themeVars } from "@/lib/cultures";
import { unreadCount } from "@/lib/posts";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  // A member sees the app in their own culture's colors; visitors see the neutral Boundless theme.
  const culture = user ? cultureOf(user.nationality) : DEFAULT_CULTURE;
  const unread = user ? await unreadCount(user.id, user.seen_at) : 0;
  const other = lang === "ko" ? "en" : "ko";

  return (
    <div style={themeVars(culture) as CSSProperties} className="min-h-screen bg-paper pb-24 text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-xl items-center gap-2 px-4 py-2.5">
          <Link href="/" className="mr-auto text-ink" aria-label="Boundless home">
            <Logo />
          </Link>
          <form action={setLang.bind(null, other)}>
            <button className="inline-flex h-9 items-center gap-1 rounded-full border border-ink/15 bg-white px-3 text-[13px] font-bold" aria-label={t("화면 언어 바꾸기")}>
              <Icon name="globe" size={16} />
              {lang.toUpperCase()}
            </button>
          </form>
          {user ? (
            <Link href="/settings" className="inline-flex h-9 items-center rounded-full bg-soft px-3" title={t("내 공개 국적")} aria-label={t("내 공개 국적")}>
              <Flag code={user.nationality} h={16} />
            </Link>
          ) : (
            <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-[13px] font-bold text-paper">
              {t("로그인")}
            </Link>
          )}
        </div>
        {user && <div className="bg-pattern h-1.5 bg-primary bg-[length:auto_24px]" aria-hidden="true" />}
      </header>
      <main className="mx-auto max-w-xl">{children}</main>
      <BottomNav labels={{ feed: t("피드"), search: t("검색"), me: t("내 글"), guide: t("안내"), settings: t("설정") }} unread={unread} />
    </div>
  );
}
