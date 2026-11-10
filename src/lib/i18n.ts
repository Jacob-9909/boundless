// Client-safe i18n helpers. The Korean sentence is the dictionary key:
// wrap UI text as t(<Korean sentence>) and add the English line to ./en.ts.
// Other languages live in ./locales/<lang>.json, machine-translated from English by
// `node scripts/i18n-translate.mjs`. `node scripts/i18n-check.mjs` fails when an English line is missing.

/** Interface languages: Korean, English, and the language of every culture theme. */
export const LANGS = ["ko", "en", "zh", "vi", "th", "uz", "mn", "fil", "ne", "id", "ja", "km", "kk", "ru", "fr", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);
/** Own-language names, static so server and browser render the same text. */
export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  zh: "中文",
  vi: "Tiếng Việt",
  th: "ไทย",
  uz: "Oʻzbekcha",
  mn: "Монгол",
  fil: "Filipino",
  ne: "नेपाली",
  id: "Bahasa Indonesia",
  ja: "日本語",
  km: "ខ្មែរ",
  kk: "Қазақша",
  ru: "Русский",
  fr: "Français",
  hi: "हिन्दी",
};
/** Languages whose lines come from machine translation and still need a native speaker's review. */
export const MACHINE_LANGS: readonly Lang[] = LANGS.filter((l) => l !== "ko" && l !== "en");

/** Browser language codes that differ from ours. */
const ALIASES: Record<string, Lang> = { tl: "fil", in: "id" };
export const toLang = (code: string | undefined): Lang | null => {
  const c = code?.toLowerCase().split("-")[0] ?? "";
  const l = ALIASES[c] ?? c;
  return isLang(l) ? l : null;
};
/** First supported language in an Accept-Language header, else English. */
export const pickLang = (accept: string): Lang => {
  for (const part of accept.split(",")) {
    const l = toLang(part.split(";")[0].trim());
    if (l) return l;
  }
  return "en";
};

export type T = (ko: string, vars?: Record<string, string | number>) => string;
export type Dict = Record<string, string>;

export const translatorOf =
  (dict: Dict): T =>
  (ko, vars) => {
    let s = dict[ko] ?? ko;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };

export const COUNTRIES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " "
  );
const COUNTRY_SET = new Set(COUNTRIES);
export const isCountry = (code: string) => COUNTRY_SET.has(code);

// Intl formatters are costly to build and every list renders dozens of names and times: keep one per locale.
const displayNames = new Map<string, Intl.DisplayNames>();
function displayName(code: string, locale: string, type: "region" | "language") {
  const key = `${locale}|${type}`;
  let d = displayNames.get(key);
  if (!d) displayNames.set(key, (d = new Intl.DisplayNames([locale], { type })));
  return d.of(code) ?? code;
}

export function countryName(code: string, lang: Lang) {
  return displayName(code, lang, "region");
}

const sorted = new Map<Lang, { code: string; name: string }[]>();
export function sortedCountries(lang: Lang) {
  let list = sorted.get(lang);
  if (!list) {
    const { compare } = new Intl.Collator(lang);
    sorted.set(lang, (list = COUNTRIES.map((code) => ({ code, name: countryName(code, lang) })).sort((a, b) => compare(a.name, b.name))));
  }
  return list;
}

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

// Residence status, optional per post on life boards: the same visa question has different answers for D-2 and F-6.
export const VISAS = [
  { id: "d2", ko: "D-2 유학" },
  { id: "d4", ko: "D-4 어학연수" },
  { id: "d10", ko: "D-10 구직" },
  { id: "e7", ko: "E-7 전문직" },
  { id: "e9", ko: "E-9 비전문취업" },
  { id: "h2", ko: "H-2 방문취업" },
  { id: "f2", ko: "F-2 거주" },
  { id: "f4", ko: "F-4 재외동포" },
  { id: "f5", ko: "F-5 영주" },
  { id: "f6", ko: "F-6 결혼이민" },
  { id: "etc", ko: "그 밖의 체류자격" },
] as const;
export const isVisa = (v: string) => VISAS.some((x) => x.id === v);
export const visaLabel = (id: string, t: T) => t(VISAS.find((x) => x.id === id)?.ko ?? "");

// Languages a post can be written in: every interface language plus Spanish. The original is always labeled.
export const POST_LANGS: string[] = [...LANGS, "es", "other"];
/** The language's own name ("français"), for compact labels. */
export function langAutonym(code: string, lang: Lang) {
  if (code === "other") return lang === "ko" ? "기타 언어" : "Other";
  return displayName(code, code, "language");
}

export function langName(code: string, lang: Lang) {
  const own = langAutonym(code, lang);
  if (code === "other") return own;
  const local = displayName(code, lang, "language");
  return own === local ? own : `${local} · ${own}`;
}

/** Languages a member can read translations in. */
export const READ_LANGS = POST_LANGS.filter((l) => l !== "other");

/** Translation target: the member's choice, else the interface language (which defaults to their culture's). */
export function readLangOf(user: { read_lang?: string | null } | null, ui: Lang) {
  return user?.read_lang && READ_LANGS.includes(user.read_lang) ? user.read_lang : ui;
}

export const REPORT_REASONS = [
  { id: "privacy", ko: "개인정보 노출 또는 위협" },
  { id: "hate", ko: "혐오·차별 표현" },
  { id: "scam", ko: "사기·불법 거래" },
  { id: "spam", ko: "광고·도배" },
  { id: "other", ko: "기타" },
] as const;

const relative = new Map<Lang, Intl.RelativeTimeFormat>();
export function timeAgo(d: Date | string, lang: Lang) {
  const sec = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  let rtf = relative.get(lang);
  if (!rtf) relative.set(lang, (rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" })));
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
