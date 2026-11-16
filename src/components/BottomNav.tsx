"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const ITEMS = [
  { href: "/feed", icon: "home", key: "feed" },
  { href: "/boards", icon: "grid", key: "boards" },
  { href: "/lounge", icon: "users", key: "lounge" },
  { href: "/me", icon: "file", key: "me" },
  { href: "/settings", icon: "sliders", key: "settings" },
] as const;

/** Phone tab bar (Astryx has none), drawn with the Astryx tokens; the current tab reads like the selected side-nav item. */
export function BottomNav({ labels, unread = 0 }: { labels: Record<(typeof ITEMS)[number]["key"], string>; unread?: number }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background-body)_95%,transparent)] backdrop-blur" aria-label="Main">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {ITEMS.map((it) => {
          const active = path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-element)] py-1.5 text-[11px] leading-tight transition-colors ${
                  active ? "bg-[var(--color-accent-muted)] font-bold text-[var(--color-text-accent)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]"
                }`}
              >
                <Icon name={it.icon} size={21} />
                {labels[it.key]}
                {it.key === "me" && unread > 0 && (
                  <span className="absolute top-0.5 right-[calc(50%-20px)] min-w-4 rounded-full bg-alert px-1 text-[11px] leading-4 font-bold text-white" aria-label={`${unread}`}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
