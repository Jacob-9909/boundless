"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const ITEMS = [
  { href: "/feed", icon: "home", key: "feed" },
  { href: "/search", icon: "search", key: "search" },
  { href: "/me", icon: "file", key: "me" },
  { href: "/guide", icon: "info", key: "guide" },
  { href: "/settings", icon: "sliders", key: "settings" },
] as const;

export function BottomNav({ labels, unread = 0 }: { labels: Record<(typeof ITEMS)[number]["key"], string>; unread?: number }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 backdrop-blur" aria-label="Main">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {ITEMS.map((it) => {
          const active = path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] leading-tight ${active ? "bg-soft font-bold text-primary" : "opacity-65"}`}
              >
                <Icon name={it.icon} size={21} />
                {labels[it.key]}
                {it.key === "me" && unread > 0 && (
                  <span className="absolute top-0.5 right-[calc(50%-20px)] min-w-4 rounded-full bg-extra px-1 text-[11px] leading-4 font-bold text-white" aria-label={`${unread}`}>
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
