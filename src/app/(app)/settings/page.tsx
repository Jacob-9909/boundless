import Link from "next/link";
import { deleteAccount, setLang, setReadLang, setRegion, signOut, unblockAll } from "@/app/actions";
import { NationalityForm } from "@/components/forms";
import { Icon } from "@/components/Icon";
import { PageHead, btn, field } from "@/components/ui";
import { canViewQueue, getT, getUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { langName, READ_LANGS, readLangOf, REGIONS, REPORT_REASONS, sortedCountries, timeAgo } from "@/lib/i18n";

export const metadata = { title: "Settings" };

const row = "flex min-h-12 items-center justify-between gap-3 border-b border-ink/10 py-3";

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
  const status: Record<string, string> = { received: t("접수됨"), actioned: t("조치 완료"), dismissed: t("문제 없음으로 종료") };

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <PageHead line="LINE 05 · SETTINGS" title={t("설정")} />
      <div className="space-y-6 px-4 py-4">
        <section>
          <h2 className="font-display text-lg font-extrabold">{t("환경 설정")}</h2>
          <div className="mt-1 border-l-4 border-primary/30 pl-3">
            <div className={row}>
              <span className="font-bold text-primary">{t("화면 언어")}</span>
              <div className="flex gap-1">
                {(["ko", "en"] as const).map((l) => (
                  <form key={l} action={setLang.bind(null, l)}>
                    <button
                      aria-pressed={lang === l}
                      className={`h-9 rounded-full px-3.5 text-[13px] font-bold ${lang === l ? "bg-primary text-paper" : "bg-white"}`}
                    >
                      {l === "ko" ? "한국어" : "English"}
                    </button>
                  </form>
                ))}
              </div>
            </div>
            <details className="border-b border-ink/10 py-3">
              <summary className="cursor-pointer font-bold">{t("커뮤니티 규칙과 안전")}</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-80">
                <li>{t("공개되는 정보는 스스로 고른 국적과 글마다 바뀌는 익명 호칭뿐이에요. 이메일은 공개되지 않아요.")}</li>
                <li>{t("이름, 연락처, 상세 주소처럼 누군가를 알아볼 수 있는 정보는 적지 마세요.")}</li>
                <li>{t("국적·인종·종교를 이유로 한 혐오와 차별은 신고 대상이에요.")}</li>
                <li>{t("답변은 경험담이에요. 비자·의료·법률 문제는 공식 기관에서 꼭 확인하세요. (외국인종합안내센터 1345)")}</li>
              </ul>
            </details>
          </div>
        </section>

        {user ? (
          <>
            <section>
              <h2 className="font-display text-lg font-extrabold">{t("계정")}</h2>
              <div className="mt-1 space-y-1 border-l-4 border-primary/30 pl-3">
                <div className="py-3">
                  <NationalityForm lang={lang} current={user.nationality} countries={sortedCountries(lang)} />
                </div>
                <form action={setRegion} className="space-y-1 border-b border-ink/10 py-3">
                  <label htmlFor="my-region" className="block text-sm font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="pin" size={15} />
                      {t("내 지역")}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <select id="my-region" name="region" defaultValue={user.region ?? ""} className={field}>
                      <option value="">{t("정하지 않음")}</option>
                      {REGIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {t(r.ko)}
                        </option>
                      ))}
                    </select>
                    <button className={btn}>{t("저장")}</button>
                  </div>
                  <p className="text-xs opacity-70">{t("글쓰기 기본 지역이 되고, 피드에서 우리 지역 글을 바로 볼 수 있어요. 공개되지 않아요.")}</p>
                </form>
                <form action={setReadLang} className="space-y-1 border-b border-ink/10 py-3">
                  <label htmlFor="read-lang" className="block text-sm font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="translate" size={15} />
                      {t("번역해서 읽을 언어")}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <select id="read-lang" name="read_lang" defaultValue={user.read_lang ?? ""} className={field}>
                      <option value="">{t("국적에 맞춰 자동 ({lang})", { lang: langName(readLangOf({ nationality: user.nationality }, lang), lang) })}</option>
                      {READ_LANGS.map((l) => (
                        <option key={l} value={l}>
                          {langName(l, lang)}
                        </option>
                      ))}
                    </select>
                    <button className={btn}>{t("저장")}</button>
                  </div>
                  <p className="text-xs opacity-70">{t("글과 댓글의 번역 버튼이 이 언어로 번역해요.")}</p>
                </form>
                <div className={row}>
                  <span className="font-bold">{t("로그인 이메일 (비공개)")}</span>
                  <span className="truncate text-sm opacity-70">{user.email}</span>
                </div>
                <div className={row} id="reports">
                  <span className="font-bold">{t("내 신고")}</span>
                  <span className="text-sm opacity-70">{reports.length}</span>
                </div>
                {reports.length > 0 && (
                  <ul className="space-y-1 pb-2 text-sm">
                    {reports.map((r) => (
                      <li key={r.id} className="flex items-center gap-2">
                        <span className="rounded bg-soft px-2 py-0.5 text-xs font-bold">{status[r.status]}</span>
                        <span className="truncate">{t(REPORT_REASONS.find((x) => x.id === r.reason)?.ko ?? "기타")}</span>
                        <span className="ml-auto shrink-0 text-xs opacity-60">{timeAgo(r.created_at, lang)}</span>
                        {r.post_id && (
                          <Link href={`/posts/${r.post_id}`} className="shrink-0 text-xs text-primary underline">
                            {t("보기")}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className={row}>
                  <span className="font-bold">{t("차단한 계정")}</span>
                  <span className="flex items-center gap-2 text-sm">
                    {blocked[0].n}
                    {blocked[0].n > 0 && (
                      <form action={unblockAll}>
                        <button className="text-xs text-primary underline">{t("모두 해제")}</button>
                      </form>
                    )}
                  </span>
                </div>
                {canViewQueue(user) && (
                  <Link href="/admin" className={`${row} font-bold text-primary`}>
                    {t("운영 큐")} <span aria-hidden="true">›</span>
                  </Link>
                )}
                <details className="border-b border-ink/10 py-3">
                  <summary className="cursor-pointer font-bold text-red-700">{t("탈퇴하기")}</summary>
                  <form action={deleteAccount} className="mt-2 space-y-2 text-sm">
                    <p className="opacity-80">{t("탈퇴하면 내 글, 댓글, 신고 기록이 모두 삭제되고 되돌릴 수 없어요.")}</p>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="confirm" required /> {t("모두 삭제되는 것을 이해했어요")}
                    </label>
                    <button className="h-11 rounded-xl bg-red-700 px-5 text-[15px] font-bold text-white">{t("탈퇴")}</button>
                  </form>
                </details>
                <form action={signOut} className="py-3">
                  <button className="font-bold">{t("로그아웃")}</button>
                </form>
              </div>
            </section>
          </>
        ) : (
          <Link href="/login?next=/settings" className={btn}>
            {t("로그인")}
          </Link>
        )}
      </div>
    </div>
  );
}
