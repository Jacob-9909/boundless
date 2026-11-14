import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * Boundless on Astryx. Neutral supplies the icon set, status colors and motion; this theme sets
 * the type, shape and component character. Culture colors (accent, ink, paper) are not here:
 * they change per member and per login screen, so src/app/globals.css maps them from the --c-*
 * variables on every element that carries a culture (see the "culture" layer there).
 */
export const boundlessTheme = defineTheme({
  name: "boundless",
  extends: neutralTheme,
  // Body 15px like the old design; neutral's touch adaptation still lifts phones to 16px.
  typography: {
    scale: { base: 15, ratio: 1.2 },
    body: { family: "Asta Sans", fallbacks: 'system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif' },
    heading: { family: "Bricolage Grotesque", fallbacks: '"Asta Sans", system-ui, "Apple SD Gothic Neo", sans-serif', weights: { 1: "800", 2: "800", 3: "bold", 4: "bold" } },
    code: { family: "ui-monospace", fallbacks: '"SF Mono", Menlo, Consolas, monospace' },
  },
  // Rounder than neutral: controls 12px, cards 16px, page panels 24px (a friendly community, not a console).
  radius: { base: 4, multiplier: 1 },
  motion: { character: "expressive" },
  tokens: {
    // next/font exposes the faces as variables with hashed family names, so point the families at them.
    "--font-family-body": 'var(--font-body), system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
    "--font-family-heading": "var(--font-brand), var(--font-body), system-ui, sans-serif",
    "--radius-inner": "0.375rem",
    "--radius-element": "0.75rem",
    "--radius-container": "1rem",
    "--radius-page": "1.5rem",
    // Neutral's 28/32/36px controls are console-sized; members tap these on phones.
    "--size-element-sm": "32px",
    "--size-element-md": "40px",
    "--size-element-lg": "44px",
  },
  adaptations: {
    rules: [{ when: { pointer: "coarse" }, value: { tokens: { "--size-element-sm": "36px", "--size-element-md": "44px", "--size-element-lg": "48px" } } }],
  },
  components: {
    button: {
      base: { fontWeight: "700" },
      "variant:primary": { boxShadow: "0 1px 0 rgb(0 0 0 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.12)" },
    },
    card: { base: { boxShadow: "0 1px 2px rgb(16 24 40 / 0.04)" } },
    badge: { base: { fontWeight: "700" } },
    // The current page reads in the member's own culture color, not neutral gray.
    "side-nav-item": { selected: { backgroundColor: "var(--color-accent-muted)", color: "var(--color-text-accent)", fontWeight: "700" } },
    "segmented-control-item": { selected: { backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)", fontWeight: "700" } },
  },
});
