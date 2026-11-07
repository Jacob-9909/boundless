// Culture themes. The login screen re-skins itself with the chosen culture,
// and a signed-in member's own culture tints the app chrome.
// Countries without a theme fall back to the neutral "Boundless" route-map theme.
import { landmarkSvg } from "./landmarks";

export type Palette = { primary: string; accent: string; ink: string; paper: string; soft: string; extra: string };

export type Culture = {
  code: string; // ISO 3166-1 alpha-2, or "XX" for the default theme
  native: string; // country name in its own language
  hello: string; // one-word hello in the local language
  greet: string; // welcome line in the local language
  line: string; // "you are not alone in Korea" in the local language
  langs: string[]; // browser language prefixes that suggest this culture
  font: string; // CSS variable set by the login page fonts
  motif: { ko: string; en: string }; // what the pattern and colors reference
  c: Palette;
  pattern: (c: Palette) => string; // SVG tile, inline
};

const svg = (w: number, h: number, body: string, scale = 1) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='${w * scale}' height='${h * scale}' viewBox='0 0 ${w} ${h}'>${body}</svg>`;

function star(cx: number, cy: number, r: number, fill: string) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.42 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `<polygon points='${pts.join(" ")}' fill='${fill}'/>`;
}

function petals(cx: number, cy: number, n: number, rx: number, ry: number, fill: string) {
  return Array.from(
    { length: n },
    (_, i) => `<ellipse cx='${cx}' cy='${cy - ry}' rx='${rx}' ry='${ry}' fill='${fill}' transform='rotate(${(360 / n) * i} ${cx} ${cy})'/>`
  ).join("");
}

export const DEFAULT_CULTURE: Culture = {
  code: "XX",
  native: "Boundless",
  hello: "안녕하세요",
  greet: "Welcome to Boundless",
  line: "어디서 왔든, 여기선 모두 이웃이에요.",
  langs: [],
  font: "--font-brand",
  motif: { ko: "국경 없이 이어지는 노선도", en: "A route map with no borders" },
  c: { primary: "#1B3A6B", accent: "#4FA3E0", ink: "#0E1B33", paper: "#F3F6FB", soft: "#D6E8F8", extra: "#E4572E" },
  pattern: (c) =>
    svg(
      120,
      120,
      `<g fill='none' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'>` +
        `<path d='M-10 30 H50 L90 70 H130' stroke='${c.extra}'/>` +
        `<path d='M30 -10 V40 L70 80 V130' stroke='${c.accent}'/>` +
        `<path d='M-10 100 H130' stroke='#3BB273'/></g>` +
        `<g fill='${c.paper}' stroke='${c.ink}' stroke-width='3'><circle cx='50' cy='30' r='5'/><circle cx='70' cy='80' r='5'/><circle cx='30' cy='100' r='5'/></g>`
    ),
};

export const CULTURES: Culture[] = [
  {
    code: "CN",
    native: "中国",
    hello: "你好",
    greet: "欢迎来到 Boundless",
    line: "在韩国，你并不孤单。",
    langs: ["zh-cn", "zh-hans"],
    font: "--font-cn",
    motif: { ko: "회문(回纹) 창살 무늬 · 주홍과 금빛", en: "Huiwen fret lattice · vermilion and gold" },
    c: { primary: "#B3122B", accent: "#E8B33A", ink: "#3A0D0D", paper: "#FFF7EE", soft: "#F9DCCB", extra: "#7A0C1C" },
    pattern: (c) =>
      svg(40, 40, `<path d='M4 36 V4 H36 V28 H12 V12 H28 V20 H20' fill='none' stroke='${c.accent}' stroke-width='3'/>`),
  },
  {
    code: "VN",
    native: "Việt Nam",
    hello: "Xin chào",
    greet: "Chào mừng bạn đến với Boundless",
    line: "Ở Hàn Quốc, bạn không hề đơn độc.",
    langs: ["vi"],
    font: "--font-vn",
    motif: { ko: "연꽃 · 옻칠(sơn mài) 붉은색", en: "Lotus · sơn mài lacquer red" },
    c: { primary: "#A8242B", accent: "#F2A7B5", ink: "#2E1A14", paper: "#FFF8F0", soft: "#FAE1DD", extra: "#3E7C4A" },
    pattern: (c) =>
      svg(
        56,
        56,
        `<g transform='translate(0 4)'>` +
          `<path d='M28 12 C35 22 35 32 28 40 C21 32 21 22 28 12Z' fill='${c.accent}'/>` +
          `<path d='M28 40 C18 38 12 30 12 22 C20 24 26 30 28 40Z' fill='${c.accent}' opacity='.75'/>` +
          `<path d='M28 40 C38 38 44 30 44 22 C36 24 30 30 28 40Z' fill='${c.accent}' opacity='.75'/>` +
          `<path d='M18 44 H38' stroke='${c.extra}' stroke-width='2.5' stroke-linecap='round'/></g>`
      ),
  },
  {
    code: "TH",
    native: "ประเทศไทย",
    hello: "สวัสดี",
    greet: "ยินดีต้อนรับสู่ Boundless",
    line: "ที่เกาหลี คุณไม่ได้อยู่คนเดียว",
    langs: ["th"],
    font: "--font-th",
    motif: { ko: "쁘라짬얌(Prajam Yam) 네 잎 무늬 · 타이 실크의 보라와 금", en: "Prajam Yam four-petal motif · Thai silk purple and gold" },
    c: { primary: "#4B2A82", accent: "#D9A520", ink: "#22113D", paper: "#FBF7EE", soft: "#E9E0F5", extra: "#8E6FC1" },
    pattern: (c) =>
      svg(
        40,
        40,
        `<path d='M20 0 L40 20 L20 40 L0 20Z' fill='none' stroke='${c.accent}' stroke-width='1.5' opacity='.7'/>` +
          `<g fill='${c.accent}'><circle cx='15' cy='20' r='4'/><circle cx='25' cy='20' r='4'/><circle cx='20' cy='15' r='4'/><circle cx='20' cy='25' r='4'/></g>` +
          `<circle cx='20' cy='20' r='2.2' fill='${c.primary}'/>`
      ),
  },
  {
    code: "US",
    native: "United States",
    hello: "Hello",
    greet: "Welcome to Boundless",
    line: "Far from home, never alone.",
    langs: ["en-us"],
    font: "--font-us",
    motif: { ko: "고속도로 표지판 서체 · 별과 줄무늬", en: "Highway-sign lettering · stars and stripes" },
    c: { primary: "#1F3A93", accent: "#E03C4A", ink: "#0D1A3A", paper: "#F7F7F2", soft: "#DDE4F5", extra: "#FFFFFF" },
    pattern: (c) =>
      svg(
        64,
        64,
        star(16, 16, 7, c.extra) + star(48, 48, 7, c.extra) + `<path d='M0 40 H28 M36 24 H64' stroke='${c.accent}' stroke-width='3'/>`
      ),
  },
  {
    code: "UZ",
    native: "Oʻzbekiston",
    hello: "Salom",
    greet: "Boundless'ga xush kelibsiz",
    line: "Koreyada siz yolgʻiz emassiz.",
    langs: ["uz"],
    font: "--font-uz",
    motif: { ko: "마르길란 아드라스 이캇 직물 · 레기스탄", en: "Margilan adras ikat silk · Registan" },
    c: { primary: "#0B6E73", accent: "#7FD3CF", ink: "#0B2A3C", paper: "#F4FAF9", soft: "#CDEDEB", extra: "#E8B23A" },
    pattern: (c) =>
      svg(
        40,
        64,
        // Ikat: vertical flame/diamond shapes with soft edges where dye seeps under the binding.
        `<defs><filter id='b'><feGaussianBlur stdDeviation='0.9'/></filter></defs><g filter='url(#b)'>` +
          `<path d='M20 2 C31 14 31 26 20 32 C9 26 9 14 20 2Z' fill='${c.accent}'/>` +
          `<path d='M20 32 C29 42 29 54 20 62 C11 54 11 42 20 32Z' fill='${c.extra}'/>` +
          `<path d='M20 12 C24 17 24 21 20 24 C16 21 16 17 20 12Z' fill='${c.primary}'/>` +
          `<path d='M0 18 C7 28 7 40 0 48Z M40 18 C33 28 33 40 40 48Z' fill='#E9558F' opacity='.85'/></g>`,
        1.15
      ),

  },
  {
    code: "MN",
    native: "Монгол Улс",
    hello: "Сайн уу",
    greet: "Boundless-д тавтай морилно уу",
    line: "Солонгост та ганцаараа биш.",
    langs: ["mn"],
    font: "--font-mn",
    motif: { ko: "울지(Ölzii) 매듭 · 초원의 하늘색", en: "Ölzii endless knot · steppe-sky blue" },
    c: { primary: "#0B5CAD", accent: "#F2B705", ink: "#0A2240", paper: "#F4F8FC", soft: "#D5E6F6", extra: "#C4272F" },
    pattern: (c) =>
      svg(
        48,
        48,
        `<g fill='none' stroke='${c.accent}' stroke-width='2.5'><rect x='15' y='15' width='18' height='18' transform='rotate(45 24 24)'/>` +
          `<circle cx='24' cy='6' r='4.5'/><circle cx='42' cy='24' r='4.5'/><circle cx='24' cy='42' r='4.5'/><circle cx='6' cy='24' r='4.5'/></g>`
      ),
  },
  {
    code: "PH",
    native: "Pilipinas",
    hello: "Mabuhay",
    greet: "Mabuhay! Maligayang pagdating sa Boundless",
    line: "Sa Korea, hindi ka nag-iisa.",
    langs: ["fil", "tl"],
    font: "--font-ph",
    motif: { ko: "여덟 줄기 태양과 세 개의 별 · 지프니 간판 서체", en: "Eight-ray sun and three stars · jeepney sign lettering" },
    c: { primary: "#0038A8", accent: "#FCD116", ink: "#0A1E4A", paper: "#FFFDF3", soft: "#FFF1B8", extra: "#CE1126" },
    pattern: (c) =>
      svg(
        72,
        72,
        `<g transform='translate(36 36)' fill='${c.accent}'><circle r='7'/>` +
          Array.from({ length: 8 }, (_, i) => `<path d='M-2 -10 L0 -20 L2 -10Z' transform='rotate(${i * 45})'/>`).join("") +
          `</g>` +
          star(8, 8, 4, c.accent) +
          star(64, 8, 4, c.accent) +
          star(36, 66, 4, c.accent)
      ),
  },
  {
    code: "NP",
    native: "नेपाल",
    hello: "नमस्ते",
    greet: "Boundless मा स्वागत छ",
    line: "कोरियामा तपाईं एक्लो हुनुहुन्न।",
    langs: ["ne"],
    font: "--font-np",
    motif: { ko: "다카(Dhaka) 직물 문양 · 크림슨과 감청", en: "Dhaka handwoven textile · crimson and blue" },
    c: { primary: "#B0122B", accent: "#F4C542", ink: "#2A0A10", paper: "#FFF8F5", soft: "#F7D9DC", extra: "#1B2A5C" },
    pattern: (c) =>
      svg(
        40,
        40,
        `<path d='M0 10 L5 3 L10 10 L15 3 L20 10 L25 3 L30 10 L35 3 L40 10' fill='none' stroke='${c.accent}' stroke-width='2'/>` +
          `<g fill='${c.paper}' opacity='.85'><path d='M10 15 L15 20 L10 25 L5 20Z'/><path d='M30 15 L35 20 L30 25 L25 20Z'/></g>` +
          `<g fill='${c.extra}'><path d='M20 16 L23 20 L20 24 L17 20Z'/><path d='M0 16 L3 20 L0 24 L-3 20Z'/><path d='M40 16 L43 20 L40 24 L37 20Z'/></g>` +
          `<path d='M0 30 L5 37 L10 30 L15 37 L20 30 L25 37 L30 30 L35 37 L40 30' fill='none' stroke='${c.accent}' stroke-width='2'/>`,
        2
      ),
  },
  {
    code: "ID",
    native: "Indonesia",
    hello: "Halo",
    greet: "Selamat datang di Boundless",
    line: "Di Korea, kamu tidak sendirian.",
    langs: ["id", "in"],
    font: "--font-id",
    motif: { ko: "바틱 카웅(Kawung) · 소간 갈색", en: "Batik kawung · sogan brown" },
    c: { primary: "#6E4123", accent: "#E9C99A", ink: "#2B1A10", paper: "#FBF5EC", soft: "#EEDFC9", extra: "#CE1126" },
    pattern: (c) =>
      svg(
        40,
        40,
        `<g fill='${c.accent}'>` +
          [0, 90, 180, 270].map((r) => `<ellipse cx='20' cy='9' rx='6.5' ry='9' transform='rotate(${r + 45} 20 20)'/>`).join("") +
          `</g><g fill='${c.primary}'>` +
          [0, 90, 180, 270].map((r) => `<circle cx='20' cy='9' r='1.6' transform='rotate(${r + 45} 20 20)'/>`).join("") +
          `</g><circle cx='20' cy='20' r='2' fill='${c.accent}'/>`
      ),
  },
  {
    code: "JP",
    native: "日本",
    hello: "こんにちは",
    greet: "Boundlessへようこそ",
    line: "韓国でも、ひとりじゃない。",
    langs: ["ja"],
    font: "--font-jp",
    motif: { ko: "세이가이하(青海波) 물결 · 쪽빛과 주홍", en: "Seigaiha waves · ai indigo and shu vermilion" },
    c: { primary: "#1F3A5F", accent: "#9DB4CF", ink: "#121C2B", paper: "#F8F5EE", soft: "#DCE3EC", extra: "#D9381E" },
    pattern: (c) => {
      const scale = (cx: number, cy: number) =>
        [20, 14, 8, 2].map((r) => `<circle cx='${cx}' cy='${cy}' r='${r}' fill='${c.primary}' stroke='${c.accent}' stroke-width='1.5'/>`).join("");
      return svg(40, 20, scale(20, 10) + scale(0, 20) + scale(40, 20));
    },
  },
  {
    code: "KH",
    native: "កម្ពុជា",
    hello: "សួស្តី",
    greet: "សូមស្វាគមន៍មកកាន់ Boundless",
    line: "នៅប្រទេសកូរ៉េ អ្នកមិននៅម្នាក់ឯងទេ។",
    langs: ["km"],
    font: "--font-kh",
    motif: { ko: "파랑·흰색 크로마 체크 · 앙코르와트", en: "Blue-and-white krama check · Angkor Wat" },
    c: { primary: "#1D3F8F", accent: "#E9EEF8", ink: "#16213D", paper: "#F6F6F1", soft: "#DCE4F4", extra: "#D9B485" },
    pattern: (c) =>
      svg(
        36,
        36,
        `<rect width='36' height='14' fill='${c.accent}' opacity='.28'/><rect width='14' height='36' fill='${c.accent}' opacity='.28'/>` +
          `<rect y='20' width='36' height='3' fill='${c.accent}' opacity='.18'/><rect x='20' width='3' height='36' fill='${c.accent}' opacity='.18'/>`
      ),

  },
  {
    code: "KZ",
    native: "Қазақстан",
    hello: "Сәлем",
    greet: "Boundless-ке қош келдіңіз",
    line: "Кореяда сіз жалғыз емессіз.",
    langs: ["kk"],
    font: "--font-kz",
    motif: { ko: "코쉬카르 무이즈(숫양 뿔) 문양 · 하늘색과 태양 금빛", en: "Qoshqar müiz ram-horn ornament · sky blue and sun gold" },
    c: { primary: "#00799A", accent: "#F2C200", ink: "#063645", paper: "#F2FBFD", soft: "#CBEFF6", extra: "#7FDCEB" },
    pattern: (c) =>
      svg(
        56,
        48,
        `<g fill='none' stroke='${c.accent}' stroke-width='3' stroke-linecap='round'>` +
          `<path d='M28 40 V26 C28 14 16 10 11 17 C7 23 13 29 18 25'/>` +
          `<path d='M28 26 C28 14 40 10 45 17 C49 23 43 29 38 25'/></g>`
      ),
  },
  {
    code: "RU",
    native: "Россия",
    hello: "Привет",
    greet: "Добро пожаловать в Boundless",
    line: "В Корее вы не одни.",
    langs: ["ru"],
    font: "--font-ru",
    motif: { ko: "그젤(Gzhel) 도자기의 코발트 꽃 · 흰 바탕에 파랑", en: "Gzhel porcelain florals · cobalt on white" },
    c: { primary: "#1E4BA0", accent: "#D6E4F8", ink: "#0F1F3D", paper: "#F7F9FD", soft: "#DCE7F7", extra: "#FFFFFF" },
    pattern: (c) =>
      svg(
        64,
        64,
        petals(32, 32, 6, 5.5, 9, c.accent) +
          `<circle cx='32' cy='32' r='4' fill='${c.primary}' stroke='${c.extra}' stroke-width='1.5'/>` +
          `<g fill='none' stroke='${c.accent}' stroke-width='2' stroke-linecap='round' opacity='.8'>` +
          `<path d='M4 60 C8 50 14 48 20 50'/><path d='M60 4 C56 14 50 16 44 14'/></g>` +
          `<g fill='${c.accent}' opacity='.8'><circle cx='6' cy='8' r='2.5'/><circle cx='58' cy='56' r='2.5'/></g>`
      ),
  },
  {
    code: "FR",
    native: "France",
    hello: "Bonjour",
    greet: "Bienvenue sur Boundless",
    line: "En Corée, vous n’êtes pas seuls.",
    langs: ["fr"],
    font: "--font-fr",
    motif: { ko: "비스트로 차양 줄무늬 · 블뢰와 루주", en: "Bistro awning stripes · bleu and rouge" },
    c: { primary: "#1D3C8F", accent: "#F4F1EA", ink: "#121A33", paper: "#FAF8F4", soft: "#DCE2F2", extra: "#D72631" },
    pattern: (c) =>
      svg(
        40,
        44,
        `<rect x='0' y='0' width='20' height='30' fill='${c.accent}' opacity='.9'/>` +
          `<path d='M0 30 A10 10 0 0 0 20 30Z' fill='${c.accent}' opacity='.9'/>` +
          `<path d='M20 30 A10 10 0 0 0 40 30Z' fill='${c.extra}'/>` +
          `<rect x='20' y='0' width='20' height='30' fill='${c.extra}'/>`
      ),
  },
  {
    code: "IN",
    native: "भारत",
    hello: "नमस्ते",
    greet: "Boundless में आपका स्वागत है",
    line: "कोरिया में आप अकेले नहीं हैं।",
    langs: ["hi"],
    font: "--font-in",
    motif: { ko: "페이즐리(부타) · 공작빛 · 타지마할", en: "Paisley (buta) · peacock hues · Taj Mahal" },
    c: { primary: "#9E3D12", accent: "#FFD39A", ink: "#2D1606", paper: "#FFF8EF", soft: "#FBE0C8", extra: "#0E7C7B" },
    pattern: (c) =>
      svg(
        56,
        56,
        `<path d='M26 46 C11 46 9 27 19 18 C27 11 39 15 37 24 C35 31 26 29 28 22' fill='none' stroke='${c.accent}' stroke-width='3' stroke-linecap='round'/>` +
          `<circle cx='22' cy='34' r='3' fill='${c.extra}'/>` +
          [0, 56].flatMap((x) => [0, 56].map((y) => `<circle cx='${x}' cy='${y}' r='3' fill='${c.accent}'/>`)).join("") +
          `<circle cx='46' cy='44' r='2' fill='${c.accent}'/><circle cx='8' cy='8' r='2' fill='${c.accent}' opacity='.7'/>`
      ),

  },
];

const BY_CODE = new Map(CULTURES.map((c) => [c.code, c]));

export function cultureOf(code: string | null | undefined): Culture {
  return (code && BY_CODE.get(code.toUpperCase())) || DEFAULT_CULTURE;
}

/** First culture whose language matches the browser's preferred languages. */
export function cultureFromLanguages(langs: readonly string[]): Culture | null {
  for (const l of langs.map((x) => x.toLowerCase())) {
    const hit = CULTURES.find((c) => c.langs.some((p) => l === p || l.startsWith(p + "-")));
    if (hit) return hit;
  }
  return null;
}

export function landmarkMarkup(c: Culture) {
  return landmarkSvg(c.code, c.c);
}

export function patternUrl(c: Culture) {
  return `url("data:image/svg+xml,${encodeURIComponent(c.pattern(c.c))}")`;
}

/** CSS custom properties for a culture, for a style attribute. */
export function themeVars(c: Culture): Record<string, string> {
  return {
    "--c-primary": c.c.primary,
    "--c-accent": c.c.accent,
    "--c-ink": c.c.ink,
    "--c-paper": c.c.paper,
    "--c-soft": c.c.soft,
    "--c-extra": c.c.extra,
    "--c-pattern": patternUrl(c),
    "--c-font": `var(${c.font})`,
  };
}
