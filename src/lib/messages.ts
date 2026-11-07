// Server-side dictionaries. Only the current language's lines reach the browser (via <I18n>).
import { EN } from "./en";
import { translatorOf, type Dict, type Lang } from "./i18n";
import fil from "./locales/fil.json";
import fr from "./locales/fr.json";
import hi from "./locales/hi.json";
import id from "./locales/id.json";
import ja from "./locales/ja.json";
import kk from "./locales/kk.json";
import km from "./locales/km.json";
import mn from "./locales/mn.json";
import ne from "./locales/ne.json";
import ru from "./locales/ru.json";
import th from "./locales/th.json";
import uz from "./locales/uz.json";
import vi from "./locales/vi.json";
import zh from "./locales/zh.json";

const MACHINE: Partial<Record<Lang, Dict>> = { zh, vi, th, uz, mn, fil, ne, id, ja, km, kk, ru, fr, hi };
const cache = new Map<Lang, Dict>();

/** Lines for one language. Korean is the key itself; a line missing in a translation falls back to English. */
export function dictOf(lang: Lang): Dict {
  if (lang === "ko") return {};
  if (lang === "en") return EN;
  let d = cache.get(lang);
  if (!d) cache.set(lang, (d = { ...EN, ...MACHINE[lang] }));
  return d;
}

export const translator = (lang: Lang) => translatorOf(dictOf(lang));
