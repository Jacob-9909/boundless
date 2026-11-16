"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { LinkProvider } from "@astryxdesign/core/Link";
import frFR from "@astryxdesign/core/locales/fr-FR.generated.js";
import jaJP from "@astryxdesign/core/locales/ja-JP.generated.js";
import koKR from "@astryxdesign/core/locales/ko-KR.generated.js";
import ruRU from "@astryxdesign/core/locales/ru-RU.generated.js";
import viVN from "@astryxdesign/core/locales/vi-VN.generated.js";
import zhCN from "@astryxdesign/core/locales/zh-CN.generated.js";
import { Theme } from "@astryxdesign/core/theme";
import { defaultThemeSlug, themes } from "@/astryx-themes";
import type { Lang } from "@/lib/i18n";

// Astryx's own strings ("Loading", "Close", "Search"...) in the interface language where Astryx has a catalog.
// ponytail: the other ten languages fall back to Astryx's English; add catalogs when Astryx ships them.
const MESSAGES = { "ko-KR": koKR, "zh-CN": zhCN, "vi-VN": viVN, "ja-JP": jaJP, "ru-RU": ruRU, "fr-FR": frFR };
const LOCALE: Partial<Record<Lang, keyof typeof MESSAGES>> = { ko: "ko-KR", zh: "zh-CN", vi: "vi-VN", ja: "ja-JP", ru: "ru-RU", fr: "fr-FR" };

/** Astryx theme, Astryx strings in the member's language, and Next.js routing for every Astryx link. Culture palettes are light-only. */
export function Providers({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <InternationalizationProvider locale={LOCALE[lang] ?? "en"} messages={MESSAGES}>
      <Theme theme={themes[defaultThemeSlug]} mode="light">
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </InternationalizationProvider>
  );
}
