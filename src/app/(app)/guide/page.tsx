import { Banner } from "@astryxdesign/core/Banner";
import { HelpItem, PageHead } from "@/components/ui";
import { getT } from "@/lib/auth";
import { APPS, HOTLINES, SITES } from "@/lib/guide";

export const metadata = { title: "Official help" };

export default async function GuidePage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl lg:ml-2 pb-6">
      <PageHead line="LINE 06 · GUIDE" title={t("공식 안내")} desc={t("커뮤니티 답변과 함께 정부·공공기관 안내를 꼭 확인하세요.")} />
      <div className="space-y-6 px-4 py-4">
        <section>
          <h2 className="font-display text-lg font-extrabold">{t("전화 상담 · 긴급")}</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{t("휴대폰에서 누르면 바로 전화가 걸려요.")}</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {HOTLINES.map((h) => (
              <li key={h.tel}>
                <HelpItem h={h} t={t} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-extrabold">{t("정부·공공 사이트")}</h2>
          <ul className="mt-2 grid gap-2">
            {SITES.map((h) => (
              <li key={h.url}>
                <HelpItem h={h} t={t} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-extrabold">{t("앱")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {APPS.map((a) => (
              <li key={a.name}>
                <b>{t(a.name)}</b> · {t(a.desc)}
              </li>
            ))}
          </ul>
        </section>

        <Banner status="info" collapsible={false} title={t("Boundless는 위 기관과 관계가 없어요. 제도와 연락처는 바뀔 수 있으니 공식 사이트에서 최신 내용을 확인하세요. (2026년 11월 확인)")} />
      </div>
    </div>
  );
}
