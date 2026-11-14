"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useT } from "@/components/I18n";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="p-4">
      <Banner
        role="alert"
        status="error"
        collapsible={false}
        title={t("페이지를 불러오지 못했어요")}
        description={t("연결 상태를 확인하고 다시 시도해 주세요.")}
        endContent={<Button label={t("다시 시도")} variant="destructive" size="lg" onClick={reset} />}
      />
    </div>
  );
}
