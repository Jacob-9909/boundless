"use client";

import type { ReactNode } from "react";
import { Tab, TabList } from "@astryxdesign/core/TabList";

export type NavTab = { value: string; label: string; href: string; icon?: ReactNode };

/**
 * Link tabs on Astryx TabList: a nav landmark that marks the current tab with aria-current.
 * Server pages pass plain data. Each tab is a link, so the URL (and the page that renders it) is the
 * state and onChange has nothing to do.
 */
export function NavTabs({ label, value, tabs, layout, size }: { label: string; value: string; tabs: NavTab[]; layout?: "hug" | "fill"; size?: "sm" | "md" | "lg" }) {
  return (
    <TabList aria-label={label} value={value} onChange={() => {}} layout={layout} size={size}>
      {tabs.map((x) => (
        <Tab key={x.value} {...x} />
      ))}
    </TabList>
  );
}
