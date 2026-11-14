import { Button } from "@astryxdesign/core/Button";
import { setLang } from "@/app/actions";
import { LANG_NAMES, LANGS, MACHINE_LANGS, type Lang } from "@/lib/i18n";
import { Icon } from "./Icon";

/**
 * Interface-language picker. No hooks, so server pages and the client login screen both use it.
 * A native <details> popover of one-form-per-language posts to the setLang action, so it works before
 * (and without) JavaScript; the trigger and panel use the Astryx tokens, the choices are Astryx Buttons.
 * `key={lang}` closes the popover after a pick (the page re-renders in the new language).
 */
export function LangMenu({
  lang,
  label,
  note,
  tone = "light",
  align = "right",
  up = false,
  compact = false,
}: {
  lang: Lang;
  label: string;
  note: string;
  tone?: "light" | "dark" | "glass";
  align?: "left" | "right";
  up?: boolean;
  compact?: boolean;
}) {
  const btnTone = {
    light: "bg-[var(--color-background-card)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-emphasized)] hover:bg-[var(--color-background-muted)]",
    dark: "text-white/85 ring-1 ring-white/20 hover:bg-white/10",
    glass: "bg-white/15 backdrop-blur hover:bg-white/25",
  }[tone];
  return (
    <details key={lang} className="group relative">
      <summary
        aria-label={label}
        title={label}
        className={`flex h-[var(--size-element-md)] cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap [&::-webkit-details-marker]:hidden ${compact ? "" : "w-full justify-center"} ${btnTone}`}
      >
        <Icon name="globe" size={16} />
        {compact ? lang.toUpperCase() : LANG_NAMES[lang]}
        <Icon name="down" size={14} className="opacity-70 transition group-open:rotate-180" />
      </summary>
      <div
        className={`absolute z-50 w-[288px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-container)] bg-[var(--color-background-popover)] p-2 text-[var(--color-text-primary)] shadow-2xl ring-1 ring-[var(--color-border)] ${align === "right" ? "right-0" : "left-0"} ${up ? "bottom-full mb-2" : "top-full mt-2"}`}
      >
        <p className="px-2 pt-1 pb-1.5 text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
        <ul className="grid max-h-[55svh] grid-cols-2 gap-0.5 overflow-y-auto">
          {LANGS.map((l) => (
            <li key={l} lang={l}>
              <form action={setLang.bind(null, l)}>
                <Button
                  type="submit"
                  label={LANG_NAMES[l]}
                  variant="ghost"
                  width="100%"
                  aria-current={l === lang ? "true" : undefined}
                  endContent={l === lang ? <Icon name="check" size={14} /> : undefined}
                  className={`justify-between px-2.5 text-[13px] ${l === lang ? "bg-[var(--color-accent-muted)] text-[var(--color-text-accent)]" : "font-medium"}`}
                />
              </form>
            </li>
          ))}
        </ul>
        <p className={`mt-1.5 rounded-[var(--radius-element)] px-2.5 py-2 text-[11px] leading-snug text-[var(--color-text-secondary)] ${MACHINE_LANGS.includes(lang) ? "bg-[var(--color-background-muted)]" : ""}`}>{note}</p>
      </div>
    </details>
  );
}
