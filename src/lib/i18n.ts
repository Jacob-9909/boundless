// Client-safe i18n helpers. The Korean sentence is the dictionary key:
// wrap UI text as t(<Korean sentence>) and add the English line to ./en.ts.
// `node scripts/i18n-check.mjs` fails when a key is missing.
import { cultureOf } from "./cultures";
import { EN } from "./en";

export type Lang = "ko" | "en";
export type T = (ko: string, vars?: Record<string, string | number>) => string;

export function tr(lang: Lang, ko: string, vars?: Record<string, string | number>) {
  let s = lang === "en" ? (EN[ko] ?? ko) : ko;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export const translator = (lang: Lang): T => (ko, vars) => tr(lang, ko, vars);

export const COUNTRIES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " "
  );
const COUNTRY_SET = new Set(COUNTRIES);
export const isCountry = (code: string) => COUNTRY_SET.has(code);

export function countryName(code: string, lang: Lang) {
  return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;
}

export function sortedCountries(lang: Lang) {
  return COUNTRIES.map((code) => ({ code, name: countryName(code, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang));
}

// Topic "stations" on the home route map.
// Provinces, for neighborhood-style filtering ("my area"). Rules like recycling differ by area.
export const REGIONS = [
  { id: "seoul", ko: "서울" },
  { id: "busan", ko: "부산" },
  { id: "daegu", ko: "대구" },
  { id: "incheon", ko: "인천" },
  { id: "gwangju", ko: "광주" },
  { id: "daejeon", ko: "대전" },
  { id: "ulsan", ko: "울산" },
  { id: "sejong", ko: "세종" },
  { id: "gyeonggi", ko: "경기" },
  { id: "gangwon", ko: "강원" },
  { id: "chungbuk", ko: "충북" },
  { id: "chungnam", ko: "충남" },
  { id: "jeonbuk", ko: "전북" },
  { id: "jeonnam", ko: "전남" },
  { id: "gyeongbuk", ko: "경북" },
  { id: "gyeongnam", ko: "경남" },
  { id: "jeju", ko: "제주" },
] as const;
export const isRegion = (v: string) => REGIONS.some((x) => x.id === v);
export const regionLabel = (id: string | null, t: T) => (id ? t(REGIONS.find((x) => x.id === id)?.ko ?? "") : t("지역 무관"));

// Languages a post can be written in. Content is never machine-translated; we label the original.
export const POST_LANGS = ["ko", "en", "zh", "vi", "th", "uz", "mn", "fil", "ne", "id", "ja", "km", "kk", "ru", "fr", "hi", "es", "other"];
/** The language's own name ("français"), for compact labels. */
export function langAutonym(code: string, lang: Lang) {
  if (code === "other") return lang === "ko" ? "기타 언어" : "Other";
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

export function langName(code: string, lang: Lang) {
  if (code === "other") return lang === "ko" ? "기타 언어" : "Other";
  const own = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  const local = new Intl.DisplayNames([lang], { type: "language" }).of(code) ?? code;
  return own === local ? own : `${local} · ${own}`;
}

/** Languages a member can read translations in. */
export const READ_LANGS = POST_LANGS.filter((l) => l !== "other");

/** Translation target: the member's choice, else their culture's language, else the UI language. */
export function readLangOf(user: { nationality: string; read_lang?: string | null } | null, ui: Lang) {
  if (user?.read_lang && READ_LANGS.includes(user.read_lang)) return user.read_lang;
  const guess = user ? (cultureOf(user.nationality).langs[0]?.split("-")[0] ?? "") : "";
  return READ_LANGS.includes(guess) ? guess : ui;
}

export const REPORT_REASONS = [
  { id: "privacy", ko: "개인정보 노출 또는 위협" },
  { id: "hate", ko: "혐오·차별 표현" },
  { id: "scam", ko: "사기·불법 거래" },
  { id: "spam", ko: "광고·도배" },
  { id: "other", ko: "기타" },
] as const;

export function timeAgo(d: Date | string, lang: Lang) {
  const sec = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 30],
    ["month", 12],
  ];
  let v = sec;
  for (const [unit, size] of steps) {
    if (Math.abs(v) < size) return rtf.format(Math.trunc(v), unit);
    v /= size;
  }
  return rtf.format(Math.trunc(v), "year");
}
