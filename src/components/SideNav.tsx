"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

export type NavItem = { href: string; icon: IconName; label: string; badge?: number };

/** Desktop sidebar navigation with the active page highlighted. */
export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main">
      <ul className="space-y-0.5">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition ${active ? "bg-soft font-bold text-primary" : "text-ink/75 hover:bg-ink/[.05]"}`}
              >
                <Icon name={it.icon} size={20} />
                {it.label}
                {!!it.badge && (
                  <span className="ml-auto min-w-5 rounded-full bg-extra px-1.5 text-center text-xs leading-5 font-bold text-white">{it.badge > 9 ? "9+" : it.badge}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
