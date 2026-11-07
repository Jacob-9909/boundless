"use client";

import { tr, type Lang } from "@/lib/i18n";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const lang: Lang = typeof document !== "undefined" && document.documentElement.lang === "ko" ? "ko" : "en";
  return (
    <div className="p-4">
      <div role="alert" className="rounded-2xl border border-dashed border-red-300 bg-red-50 p-5 text-red-950">
        <p className="station-label text-red-700">{tr(lang, "다시 시도")}</p>
        <p className="mt-1 font-display text-lg font-bold">{tr(lang, "페이지를 불러오지 못했어요")}</p>
        <p className="mt-1 text-sm opacity-80">{tr(lang, "연결 상태를 확인하고 다시 시도해 주세요.")}</p>
        <button onClick={reset} className="mt-4 h-11 rounded-xl bg-red-700 px-5 text-[15px] font-bold text-white">
          {tr(lang, "다시 시도")}
        </button>
      </div>
    </div>
  );
}
