import { setLang } from "@/app/actions";
import { LANG_NAMES, LANGS, MACHINE_LANGS, type Lang } from "@/lib/i18n";
import { Icon } from "./Icon";

/**
 * Interface-language picker. No hooks, so server pages and the client login screen both use it.
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
    light: "bg-white text-ink ring-1 ring-ink/15 hover:bg-ink/[.04]",
    dark: "text-white/85 ring-1 ring-white/20 hover:bg-white/10",
    glass: "bg-white/15 backdrop-blur hover:bg-white/25",
  }[tone];
  return (
    <details key={lang} className="group relative">
      <summary
        aria-label={label}
        title={label}
        className={`flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap [&::-webkit-details-marker]:hidden ${compact ? "" : "w-full justify-center"} ${btnTone}`}
      >
        <Icon name="globe" size={16} />
        {compact ? lang.toUpperCase() : LANG_NAMES[lang]}
        <Icon name="down" size={14} className="opacity-70 transition group-open:rotate-180" />
      </summary>
      <div
        className={`absolute z-50 w-[264px] rounded-2xl bg-white p-2 text-ink shadow-2xl ring-1 ring-black/10 ${align === "right" ? "right-0" : "left-0"} ${up ? "bottom-full mb-2" : "top-full mt-2"}`}
      >
        <p className="px-2 pt-1 pb-1.5 text-xs font-bold opacity-70">{label}</p>
        <ul className="grid max-h-[55vh] grid-cols-2 gap-0.5 overflow-y-auto">
          {LANGS.map((l) => (
            <li key={l} lang={l}>
              <form action={setLang.bind(null, l)}>
                <button
                  aria-current={l === lang ? "true" : undefined}
                  className={`flex min-h-9 w-full items-center gap-1 rounded-xl px-2.5 py-1.5 text-left text-[13px] leading-tight transition ${l === lang ? "bg-soft font-bold text-primary" : "hover:bg-ink/[.05]"}`}
                >
                  <span className="min-w-0 flex-1">{LANG_NAMES[l]}</span>
                  {l === lang && <Icon name="check" size={14} />}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className={`mt-1.5 rounded-xl px-2.5 py-2 text-[11px] leading-snug ${MACHINE_LANGS.includes(lang) ? "bg-paper opacity-80" : "opacity-70"}`}>{note}</p>
      </div>
    </details>
  );
}
