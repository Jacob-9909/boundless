"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Theme } from "@astryxdesign/core/theme";
import { defaultThemeSlug, themes } from "@/astryx-themes";

/** Astryx theme + Next.js routing for every Astryx link. Culture palettes are light-only, so light mode is fixed. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme theme={themes[defaultThemeSlug]} mode="light">
      <LinkProvider component={Link}>{children}</LinkProvider>
    </Theme>
  );
}
