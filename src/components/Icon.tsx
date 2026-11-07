// One stroke icon set (24px grid, 1.9 stroke) instead of emoji, so icons look the same on every OS.
const PATHS = {
  home: "M3 11 12 4l9 7v9H3z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  file: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  comment: "M4 5h16v11H9l-5 4z",
  helpful: "M7 10v10H4V10zM7 10l4-7c1.7 0 2.8 1.4 2.4 3L13 9h5.5a2 2 0 0 1 2 2.4l-1.4 7a2 2 0 0 1-2 1.6H7",
  bookmark: "M6 3h12v18l-6-4.5L6 21z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  pin: "M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  bell: "M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  flame: "M12 21c4 0 7-2.8 7-6.8 0-3.8-3-6.2-4.5-9.2-.8 2.2-2 3.4-3.5 4.2C10.5 7 10 5 10 3 6.8 5.3 5 8.9 5 13.9 5 18.1 8 21 12 21z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  reply: "M4 4v7a4 4 0 0 0 4 4h12M16 11l4 4-4 4",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  back: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 1 1 8 0v4",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, filled = false, className = "" }: { name: IconName; size?: number; filled?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
