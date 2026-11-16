import Link from "next/link";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { LangMenu } from "@/components/LangMenu";
import { setReadLang, setRegion, signOut, unblockAll } from "@/app/actions";
import { SelectField } from "@/components/fields";
import { NationalityForm } from "@/components/forms";
import { Icon } from "@/components/Icon";
import { Avatar, PageHead } from "@/components/ui";
import { AccountSwitcher } from "@/components/Community";
import { canViewQueue, demoEnabled, getT, getUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { countryName, langName, READ_LANGS, REGIONS, REPORT_REASONS, sortedCountries, timeAgo } from "@/lib/i18n";
import { DeleteAccount } from "./DeleteAccount";

export const metadata = { title: "Settings" };

const row = "flex min-h-12 items-center justify-between gap-3 px-4 py-3";
const linkRow = `${row} font-bold text-primary transition hover:bg-soft/60`;
// One surface per group, rows split by hairlines, with the member's culture color down the side.
const group = "mt-2 divide-y divide-[var(--color-border)] overflow-hidden border-l-4 border-l-primary";

export default async function SettingsPage() {
  const [{ lang, t }, user] = await Promise.all([getT(), getUser()]);
  const [reports, blocked] = user
    ? await Promise.all([
        q<{ id: string; reason: string; status: string; created_at: Date; post_id: string | null }>(
          `SELECT r.id, r.reason, r.status, r.created_at, COALESCE(r.post_id, c.post_id) AS post_id
           FROM boundless.reports r LEFT JOIN boundless.comments c ON c.id = r.comment_id
           WHERE r.reporter_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
          [user.id],
        ),
        q<{ n: number }>("SELECT count(*)::int AS n FROM boundless.blocks WHERE user_id = $1", [user.id]),
      ])
    : [[], [{ n: 0 }]];
  const status: Record<string, { label: string; variant: "info" | "success" | "neutral" }> = {
    received: { label: t("접수됨"), variant: "info" },
    actioned: { label: t("조치 완료"), variant: "success" },
    dismissed: { label: t("문제 없음으로 종료"), variant: "neutral" },
  };
  // Phones have no sidebar, so official help and the intro page are linked here, signed in or not.
  // (The phone logo goes to the feed; only the desktop logo opens the intro page.)
  const phoneLinks = (
    <>
      <Link href="/guide" className={`${linkRow} lg:hidden`}>
        {t("공식 안내")} <span aria-hidden="true">›</span>
      </Link>
      <Link href="/?intro=1" className={`${linkRow} lg:hidden`}>
        {t("Boundless 소개")} <span aria-hidden="true">›</span>
      </Link>
    </>
  );

  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="LINE 05 · SETTINGS" title={t("설정")} />
      <div className="space-y-6 px-4 py-4">
        {/* The member's profile comes first: avatar, public nationality and level, one tap from editing. */}
        {user && (
          // A real link around the card, so the tap works before the page's JS loads.
          <Link id="profile" href="/settings/avatar" className="group block rounded-[var(--radius-container)]">
            <Card padding={0} className="overflow-hidden">
              <div className="bg-pattern h-1.5 bg-primary bg-[length:auto_24px]" aria-hidden="true" />
              <div className="flex items-center gap-4 p-4">
                <Avatar code={user.nationality} size={64} look={user.avatar} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-extrabold">{t("내 프로필")}</span>
                  <span className="block text-sm leading-snug text-[var(--color-text-secondary)]">
                    {countryName(user.nationality, lang)} ·{" "}
                    {user.avatar ? (user.avatar_public ? t("내 글과 댓글에도 보여요") : t("나에게만 보여요")) : t("사람이나 동물 캐릭터를 만들어요")}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-primary group-hover:underline">
                  {user.avatar ? t("바꾸기") : t("아바타 만들기")} <span aria-hidden="true">›</span>
                </span>
              </div>
            </Card>
          </Link>
        )}
        <section>
          <h2 className="font-display text-lg font-extrabold">{t("환경 설정")}</h2>
          <Card padding={0} className={group}>
            <div className={row}>
              <span className="font-bold">{t("화면 언어")}</span>
              <LangMenu lang={lang} label={t("화면 언어 바꾸기")} note={t("한국어와 영어 밖의 언어는 기계 번역이라 어색한 문장이 있을 수 있어요. 검수하고 있어요.")} compact />
            </div>
            {/* Sample accounts switch country from the desktop sidebar; phones and tablets have no sidebar, so it sits here. */}
            {user && demoEnabled() && user.email.endsWith("@example.com") && (
              <div className="px-4 py-3 lg:hidden">
                <AccountSwitcher t={t} lang={lang} current={user.nationality} up={false} />
              </div>
            )}
            {/* The padding sits on the trigger so the whole 48px row is the tap target. */}
            <Collapsible defaultIsOpen={false} className="px-4" trigger={<span className="block py-3 text-base font-bold">{t("커뮤니티 규칙과 안전")}</span>}>
              <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
                <li>{t("공개되는 정보는 스스로 고른 국적과 글마다 바뀌는 익명 호칭뿐이에요. 이메일은 공개되지 않아요.")}</li>
                <li>{t("이름, 연락처, 상세 주소처럼 누군가를 알아볼 수 있는 정보는 적지 마세요.")}</li>
                <li>{t("국적·인종·종교를 이유로 한 혐오와 차별은 신고 대상이에요.")}</li>
                <li>{t("답변은 경험담이에요. 비자·의료·법률 문제는 공식 기관에서 꼭 확인하세요. (외국인종합안내센터 1345)")}</li>
              </ul>
            </Collapsible>
          </Card>
        </section>

        {user ? (
          <section>
            <h2 className="font-display text-lg font-extrabold">{t("계정")}</h2>
            <Card padding={0} className={group}>
              <div className="px-4 py-3">
                <NationalityForm current={user.nationality} countries={sortedCountries(lang)} />
              </div>
              <form action={setRegion} className="flex items-end gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <SelectField
                    name="region"
                    label={t("내 지역")}
                    description={t("글쓰기 기본 지역이 되고, 피드에서 우리 지역 글을 바로 볼 수 있어요. 공개되지 않아요.")}
                    defaultValue={user.region ?? ""}
                    startIcon={<Icon name="pin" size={16} />}
                    width="100%"
                    options={[{ value: "", label: t("정하지 않음") }, ...REGIONS.map((r) => ({ value: r.id, label: t(r.ko) }))]}
                  />
                </div>
                <Button type="submit" label={t("저장")} variant="secondary" />
              </form>
              <form action={setReadLang} className="flex items-end gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <SelectField
                    name="read_lang"
                    label={t("번역해서 읽을 언어")}
                    description={t("글과 댓글의 번역 버튼이 이 언어로 번역해요.")}
                    defaultValue={user.read_lang ?? ""}
                    startIcon={<Icon name="translate" size={16} />}
                    width="100%"
                    options={[
                      { value: "", label: t("화면 언어와 같게 ({lang})", { lang: langName(lang, lang) }) },
                      ...READ_LANGS.map((l) => ({ value: l, label: langName(l, lang) })),
                    ]}
                  />
                </div>
                <Button type="submit" label={t("저장")} variant="secondary" />
              </form>
              <div className={row}>
                <span className="font-bold">{t("로그인 이메일 (비공개)")}</span>
                <span className="truncate text-sm text-[var(--color-text-secondary)]">{user.email}</span>
              </div>
              <div id="reports">
                <div className={row}>
                  <span className="font-bold">{t("내 신고")}</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{reports.length}</span>
                </div>
                {reports.length > 0 && (
                  <ul className="px-4 pb-2 text-sm">
                    {reports.map((r) => (
                      <li key={r.id} className="flex min-h-11 items-center gap-2">
                        {status[r.status] && <Badge variant={status[r.status].variant} label={status[r.status].label} />}
                        <span className="truncate">{t(REPORT_REASONS.find((x) => x.id === r.reason)?.ko ?? "기타")}</span>
                        <span className="ml-auto shrink-0 text-xs text-[var(--color-text-secondary)]">{timeAgo(r.created_at, lang)}</span>
                        {r.post_id && <Button href={`/posts/${r.post_id}`} label={t("보기")} variant="ghost" className="shrink-0" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={row}>
                <span className="font-bold">{t("차단한 계정")}</span>
                <span className="flex items-center gap-2 text-sm">
                  {blocked[0].n}
                  {blocked[0].n > 0 && (
                    <form action={unblockAll}>
                      <Button type="submit" label={t("모두 해제")} variant="ghost" />
                    </form>
                  )}
                </span>
              </div>
              {phoneLinks}
              <Link href="/policy" className={linkRow}>
                {t("운영 정책")} <span aria-hidden="true">›</span>
              </Link>
              {canViewQueue(user) && (
                <Link href="/admin" className={linkRow}>
                  {t("운영 큐")} <span aria-hidden="true">›</span>
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <form action={signOut}>
                  <Button type="submit" label={t("로그아웃")} variant="secondary" />
                </form>
                <div className="ml-auto">
                  <DeleteAccount />
                </div>
              </div>
            </Card>
          </section>
        ) : (
          <>
            <Button href="/login?next=/settings" label={t("로그인")} variant="primary" size="lg" />
            <Card padding={0} className={`${group} lg:hidden`}>
              {phoneLinks}
            </Card>
          </>
        )}
        <p className="pt-2 text-center text-xs text-[var(--color-text-secondary)]">
          Boundless · {t("버전")} {process.env.APP_BUILD}
        </p>
      </div>
    </div>
  );
}
