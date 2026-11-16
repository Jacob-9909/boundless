import type { CSSProperties, ReactElement } from "react";

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
  bus: "M6 4h12a2 2 0 0 1 2 2v10H4V6a2 2 0 0 1 2-2zM4 11h16M7 19v-3M17 19v-3M8 14h.5M15.5 14h.5",
  idcard: "M3 5h18v14H3zM7 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6 16c.6-1.5 1.8-2.2 3-2.2s2.4.7 3 2.2M14 9h4M14 13h4",
  house: "M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5",
  medical: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  utensils: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11",
  ticket: "M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z",
  translate: "M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5 7M11 5c-.5 3-3 6-6 7.5M13 21l4-9 4 9M14.5 18h5",
  sparkles: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  down: "M6 9l6 6 6-6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  coffee: "M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2",
  siren: "M7 18v-5a5 5 0 0 1 10 0v5M5 18h14v3H5zM10 14a2 2 0 0 1 2-2M12 2v2M4.9 5l1.4 1.4M19.1 5l-1.4 1.4M2 12h2M20 12h2",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  lift: "M12 17V4M7 9l5-5 5 5M5 20h14",
  image: "M3 5h18v14H3zM3 17l5-5 5 5 3-3 5 5M16 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  follow: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M19 8v6M16 11h6",
  following: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 11l2 2 4-4",
} as const;

export type IconName = keyof typeof PATHS;

type SvgProps = { width?: number | string; height?: number | string; className?: string; style?: CSSProperties };
const svgCache = new Map<IconName, (p: SvgProps) => ReactElement>();

/**
 * The same glyph as an SVG component, for Astryx props typed IconType (SideNavItem, TextInput startIcon...).
 * Astryx sizes and colors it. Functions cannot cross the server/client boundary, so call this in client code.
 */
export function svgIcon(name: IconName) {
  let C = svgCache.get(name);
  if (!C) {
    C = function BoundlessIcon(p: SvgProps) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
          <path d={PATHS[name]} />
        </svg>
      );
    };
    svgCache.set(name, C);
  }
  return C;
}

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
