"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

export type NavItem = { href: string; icon: IconName; label: string; badge?: number };

/** Desktop sidebar navigation with the active page highlighted. */
export function SideNav({ items, label, compact = false }: { items: NavItem[]; label: string; compact?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="space-y-0.5">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 transition ${compact ? "h-9 text-sm" : "h-11 text-[15px]"} ${active ? "bg-soft font-bold text-primary" : "text-ink/75 hover:bg-ink/[.05]"}`}
              >
                <Icon name={it.icon} size={compact ? 18 : 20} />
                {it.label}
                {!!it.badge && (
                  <span className="ml-auto min-w-5 rounded-full bg-alert px-1.5 text-center text-xs leading-5 font-bold text-white">{it.badge > 9 ? "9+" : it.badge}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type BoardLink = { href: string; label: string; icon: IconName; color: string; today: number; todayText: string };

/** Boards grouped like Reddit's community list: the current board is highlighted, boards with posts today carry a count. */
export function BoardNav({ label, groups }: { label: string; groups: { label: string; items: BoardLink[] }[] }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1 px-3 text-[11px] font-bold tracking-[.08em] opacity-60">{g.label}</p>
          <ul className="space-y-px">
            {g.items.map((b) => {
              const active = path === b.href;
              return (
                <li key={b.href}>
                  <Link
                    href={b.href}
                    title={b.label}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-9 items-center gap-2.5 rounded-xl px-3 text-sm whitespace-nowrap transition ${active ? "bg-soft font-bold text-primary" : "text-ink/80 hover:bg-ink/[.05]"}`}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: b.color }}>
                      <Icon name={b.icon} size={13} />
                    </span>
                    <span className="min-w-0 truncate">{b.label}</span>
                    {b.today > 0 && (
                      <span className="ml-auto rounded-full bg-alert/10 px-1.5 text-[11px] leading-5 font-bold text-alert">
                        <span aria-hidden="true">{b.today}</span>
                        <span className="sr-only">{b.todayText}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
