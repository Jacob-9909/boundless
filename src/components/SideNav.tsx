"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { svgIcon, type IconName } from "./Icon";

export type NavItem = { href: string; icon: IconName; label: string; badge?: number };
export type BoardLink = { href: string; label: string; icon: IconName; color: string; today: number; todayText: string };
export type BoardGroup = { label: string; items: BoardLink[] };

const isHere = (path: string, href: string) => path === href || path.startsWith(href + "/");

/** Count bubble: alert orange for unread, pale for boards with posts today. */
function Count({ n, strong, label }: { n: number; strong?: boolean; label?: string }) {
  return (
    <span className={`min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold ${strong ? "bg-alert text-white" : "bg-alert/10 text-alert"}`}>
      <span aria-hidden={label ? true : undefined}>{n > 9 && strong ? "9+" : n}</span>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

/** A board's icon on its own color, the same chip the feed uses. Cached so the component stays stable between renders. */
const dots = new Map<string, () => ReactNode>();
function boardDot(icon: IconName, color: string) {
  const key = icon + color;
  if (!dots.has(key)) {
    const Glyph = svgIcon(icon);
    dots.set(key, function BoardDot() {
      return (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color }} aria-hidden="true">
          <Glyph width={13} height={13} />
        </span>
      );
    });
  }
  return dots.get(key)!;
}

/**
 * The app's side navigation on Astryx SideNav. AppShell shows it inline on desktop and moves it into
 * the mobile drawer below the breakpoint, so phones reach every board and page from the menu button.
 */
export function AppSideNav({
  label,
  main,
  boards,
  moreLabel,
  more,
  topContent,
  footer,
}: {
  label: string;
  main: NavItem[];
  boards: BoardGroup[];
  moreLabel: string;
  more: NavItem[];
  topContent?: ReactNode;
  footer?: ReactNode;
}) {
  const path = usePathname();
  const item = (it: NavItem, size?: "sm") => (
    <SideNavItem
      key={it.href}
      href={it.href}
      label={it.label}
      icon={svgIcon(it.icon)}
      size={size}
      isSelected={isHere(path, it.href)}
      endContent={it.badge ? <Count n={it.badge} strong /> : undefined}
    />
  );
  return (
    <SideNav aria-label={label} topContent={topContent} footer={footer}>
      <SideNavSection title={label} isHeaderHidden>
        {main.map((it) => item(it))}
      </SideNavSection>
      {boards.map((g) => (
        <SideNavSection key={g.label} title={g.label}>
          {g.items.map((b) => (
            <SideNavItem
              key={b.href}
              href={b.href}
              label={b.label}
              size="sm"
              icon={boardDot(b.icon, b.color)}
              isSelected={path === b.href}
              endContent={b.today > 0 ? <Count n={b.today} label={b.todayText} /> : undefined}
            />
          ))}
        </SideNavSection>
      ))}
      <SideNavSection title={moreLabel}>{more.map((it) => item(it, "sm"))}</SideNavSection>
    </SideNav>
  );
}
