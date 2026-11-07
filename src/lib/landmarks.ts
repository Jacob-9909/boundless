// Flat landmark / landscape silhouettes, one per culture, drawn in a 400x120 box (ground at the bottom).
// Chosen as shared national heritage rather than religious or political symbols.
import type { Palette } from "./cultures";

type Draw = (c: Palette) => string;

const g = (fill: string, body: string, extra = "") => `<g fill='${fill}' ${extra}>${body}</g>`;
const rock = (x: number, w: number, top: number) => `<path d='M${x} 112 L${x + 3} ${top + 12} Q${x + w / 2} ${top - 6} ${x + w - 3} ${top + 12} L${x + w} 112Z'/>`;
const verticals = (from: number, to: number, step: number, y1: (x: number) => number, y2: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => {
    const x = from + i * step;
    return `M${x} ${y1(x).toFixed(1)} V${y2}`;
  }).join(" ");

export const LANDMARKS: Record<string, Draw> = {
  // Seoul: Namsan with N Seoul Tower, a hanok roof, the city below.
  XX: (c) =>
    g(c.accent, `<path d='M0 120 V94 Q40 74 82 88 Q126 58 172 84 Q214 72 252 90 Q300 70 342 86 Q372 78 400 92 V120Z' opacity='.45'/>`) +
    g(
      c.accent,
      `<rect x='166' y='34' width='8' height='50'/><rect x='157' y='42' width='26' height='9' rx='3'/><rect x='169' y='12' width='2' height='22'/><path d='M158 86 H182 L177 74 H163Z'/>` +
        `<path d='M238 100 Q262 104 292 92 Q322 104 346 100 L336 107 H248Z'/><rect x='256' y='106' width='72' height='8'/>` +
        `<rect x='20' y='92' width='16' height='22'/><rect x='40' y='84' width='12' height='30'/><rect x='56' y='96' width='20' height='18'/><rect x='360' y='88' width='14' height='26'/>`
    ),
  // China: the Great Wall over the hills.
  CN: (c) =>
    g(c.accent, `<path d='M0 120 V98 Q60 78 120 94 Q180 62 240 88 Q300 72 360 92 L400 86 V120Z' opacity='.4'/>`) +
    `<path d='M0 102 Q60 82 120 96 Q180 66 240 90 Q300 76 360 94 L400 88' fill='none' stroke='${c.accent}' stroke-width='7'/>` +
    `<path d='M0 96 Q60 76 120 90 Q180 60 240 84 Q300 70 360 88 L400 82' fill='none' stroke='${c.accent}' stroke-width='4' stroke-dasharray='4 4'/>` +
    g(c.accent, [120, 240, 360].map((x, i) => { const y = [90, 84, 88][i]; return `<rect x='${x - 9}' y='${y - 18}' width='18' height='20'/><path d='M${x - 13} ${y - 18} H${x + 13} L${x + 7} ${y - 25} H${x - 7}Z'/>`; }).join("")),
  // Vietnam: Ha Long Bay karsts and a junk boat.
  VN: (c) =>
    g(c.accent, rock(10, 34, 60) + rock(40, 40, 36) + rock(96, 28, 70) + rock(150, 46, 46) + rock(330, 36, 54) + rock(362, 30, 74), "opacity='.85'") +
    g(c.accent, `<path d='M232 104 H292 L282 112 H242Z'/><path d='M246 104 V68 Q262 76 264 104Z'/><path d='M266 104 V76 Q280 82 280 104Z'/>`) +
    `<path d='M0 116 H400' stroke='${c.accent}' stroke-width='2' stroke-dasharray='14 8' opacity='.6'/>`,
  // Thailand: a traditional sala pavilion with tiered roofs and chofa finials.
  TH: (c) =>
    g(
      c.accent,
      `<path d='M118 94 L200 46 L282 94 L270 94 L200 56 L130 94Z'/><path d='M140 80 L200 30 L260 80 L248 80 L200 40 L152 80Z'/>` +
        `<rect x='150' y='92' width='100' height='6'/>` +
        [158, 182, 206, 230].map((x) => `<rect x='${x}' y='96' width='6' height='16'/>`).join("") +
        `<rect x='140' y='110' width='120' height='4'/>`
    ) +
    `<path d='M200 30 Q206 18 198 14 M118 94 Q106 90 110 80 M282 94 Q294 90 290 80 M140 80 Q130 76 133 68 M260 80 Q270 76 267 68' fill='none' stroke='${c.accent}' stroke-width='3' stroke-linecap='round'/>`,
  // United States: the Golden Gate Bridge.
  US: (c) =>
    g(c.accent, `<path d='M0 120 V96 Q30 84 70 98 L70 120Z M330 98 Q370 82 400 94 V120 H330Z' opacity='.5'/>`) +
    g(c.accent, `<rect x='110' y='28' width='10' height='88'/><rect x='280' y='28' width='10' height='88'/><rect x='107' y='40' width='16' height='4'/><rect x='107' y='60' width='16' height='4'/><rect x='277' y='40' width='16' height='4'/><rect x='277' y='60' width='16' height='4'/><rect x='0' y='84' width='400' height='5'/>`) +
    `<path d='M0 68 Q62 68 115 30 Q200 92 285 30 Q338 68 400 68' fill='none' stroke='${c.accent}' stroke-width='2.5'/>` +
    `<path d='${verticals(130, 270, 10, (x) => 61 - 31 * ((x - 200) / 85) ** 2, 84)}' stroke='${c.accent}' stroke-width='1' opacity='.7'/>`,
  // Uzbekistan: Registan's three madrasas with portals, domes and minarets.
  UZ: (c) => {
    const madrasa = (x: number) =>
      `<rect x='${x}' y='74' width='96' height='38'/><rect x='${x + 28}' y='48' width='40' height='64'/><rect x='${x - 4}' y='40' width='8' height='72'/><rect x='${x + 92}' y='40' width='8' height='72'/><circle cx='${x}' cy='40' r='5'/><circle cx='${x + 96}' cy='40' r='5'/>`;
    const arch = (x: number) => `<path d='M${x + 38} 112 V74 Q${x + 48} 60 ${x + 58} 74 V112Z' fill='${c.primary}'/>`;
    return g(c.accent, madrasa(16) + madrasa(152) + madrasa(288) + `<path d='M176 50 Q200 10 224 50Z'/>`) + arch(16) + arch(152) + arch(288) + `<path d='M188 50 Q200 22 212 50' fill='none' stroke='${c.extra}' stroke-width='2'/>`;
  },
  // Mongolia: gers on the steppe under the mountains.
  MN: (c) => {
    const ger = (x: number, s: number) =>
      `<path d='M${x} 112 V${112 - 14 * s} H${x + 56 * s} V112Z'/><path d='M${x - 4 * s} ${112 - 13 * s} Q${x + 28 * s} ${112 - 38 * s} ${x + 60 * s} ${112 - 13 * s}Z'/>`;
    return (
      g(c.accent, `<path d='M0 120 V86 L60 58 L110 80 L170 46 L230 82 L290 60 L350 84 L400 70 V120Z' opacity='.35'/>`) +
      g(c.accent, ger(70, 1.1) + ger(170, 0.8) + ger(290, 1)) +
      `<rect x='94' y='100' width='14' height='12' fill='${c.primary}'/><rect x='313' y='101' width='12' height='11' fill='${c.primary}'/>`
    );
  },
  // Philippines: rice terraces and a jeepney.
  PH: (c) =>
    g(c.accent, `<path d='M0 120 V78 Q100 64 200 76 T400 70 V120Z' opacity='.3'/><path d='M0 120 V92 Q100 80 200 90 T400 86 V120Z' opacity='.45'/><path d='M0 120 V104 Q100 94 200 102 T400 98 V120Z' opacity='.6'/>`) +
    g(c.accent, `<path d='M272 106 V88 Q272 84 276 84 H330 L344 94 H352 V106Z'/>`) +
    `<rect x='280' y='88' width='12' height='7' fill='${c.primary}'/><rect x='296' y='88' width='12' height='7' fill='${c.primary}'/><rect x='312' y='88' width='12' height='7' fill='${c.primary}'/>` +
    `<circle cx='288' cy='108' r='6' fill='${c.primary}' stroke='${c.accent}' stroke-width='3'/><circle cx='336' cy='108' r='6' fill='${c.primary}' stroke='${c.accent}' stroke-width='3'/>`,
  // Nepal: the Himalaya with a pagoda temple roofline in front.
  NP: (c) =>
    g(c.accent, `<path d='M0 120 V100 L50 70 L80 86 L130 38 L160 64 L200 26 L240 68 L270 54 L320 88 L360 72 L400 96 V120Z' opacity='.55'/>`) +
    g(c.paper, `<path d='M118 50 L130 38 L142 50 L136 48 L130 54 L124 48Z'/><path d='M186 40 L200 26 L214 40 L207 37 L200 44 L193 37Z'/><path d='M262 62 L270 54 L278 62 L270 60Z'/>`, "opacity='.9'") +
    g(c.accent, `<path d='M300 112 V100 H340 V112Z'/><path d='M292 100 L320 90 L348 100Z'/><path d='M298 90 L320 80 L342 90Z'/><path d='M304 80 L320 70 L336 80Z'/><rect x='319' y='62' width='2' height='8'/>`),
  // Indonesia: Monas, the National Monument, with its golden flame.
  ID: (c) =>
    g(c.accent, `<path d='M140 112 L156 96 H244 L260 112Z'/><path d='M193 96 L196 30 H204 L207 96Z'/>`) +
    `<path d='M200 8 Q212 18 205 30 H195 Q188 18 200 8Z' fill='${c.extra}'/>` +
    g(c.accent, [40, 70, 100, 300, 330, 360].map((x, i) => `<circle cx='${x}' cy='${98 - (i % 2) * 6}' r='${12 + (i % 3) * 2}'/><rect x='${x - 2}' y='100' width='4' height='12'/>`).join(""), "opacity='.6'"),
  // Japan: Mount Fuji and a pine.
  JP: (c) =>
    g(c.accent, `<path d='M50 112 L166 40 Q200 28 234 40 L350 112Z'/>`) +
    g(c.paper, `<path d='M146 53 L166 40 Q200 28 234 40 L254 53 L238 49 L224 58 L210 47 L196 58 L182 47 L166 56Z'/>`, "opacity='.92'") +
    g(c.accent, `<rect x='362' y='86' width='4' height='26'/><ellipse cx='364' cy='84' rx='20' ry='6'/><ellipse cx='358' cy='74' rx='14' ry='5'/><ellipse cx='370' cy='96' rx='16' ry='5'/>`, "opacity='.85'"),
  // Cambodia: Angkor Wat's five lotus-bud towers.
  KH: (c) => {
    const tower = (x: number, top: number, w: number) => `<path d='M${x} ${top} C${x + w * 0.45} ${top + 16} ${x + w * 0.5} ${top + 30} ${x + w * 0.5} 84 H${x - w * 0.5} C${x - w * 0.5} ${top + 30} ${x - w * 0.45} ${top + 16} ${x} ${top}Z'/>`;
    return g(c.extra, `<rect x='80' y='98' width='240' height='14'/><rect x='104' y='84' width='192' height='14'/>` + tower(200, 22, 26) + tower(160, 44, 20) + tower(240, 44, 20) + tower(122, 58, 16) + tower(278, 58, 16));
  },
  // Kazakhstan: Baiterek tower holding its golden sphere, the steppe and the sun.
  KZ: (c) =>
    g(c.accent, `<path d='M0 120 V100 Q100 88 200 98 T400 94 V120Z' opacity='.4'/>`) +
    g(c.accent, `<path d='M195 112 L190 46 H210 L205 112Z'/><rect x='60' y='86' width='18' height='26'/><rect x='82' y='76' width='14' height='36'/><rect x='300' y='80' width='16' height='32'/><rect x='320' y='90' width='22' height='22'/>`) +
    `<path d='M190 48 Q176 34 182 20 M210 48 Q224 34 218 20 M196 48 Q192 34 196 22 M204 48 Q208 34 204 22' fill='none' stroke='${c.accent}' stroke-width='2.5'/>` +
    `<circle cx='200' cy='24' r='13' fill='${c.extra}'/><circle cx='352' cy='30' r='10' fill='${c.extra}' opacity='.8'/>`,
  // Russia: a birch grove.
  RU: (c) => {
    const birch = (x: number, top: number) =>
      `<ellipse cx='${x + 3}' cy='${top + 4}' rx='18' ry='14' fill='${c.accent}' opacity='.55'/><ellipse cx='${x - 8}' cy='${top + 16}' rx='12' ry='9' fill='${c.accent}' opacity='.45'/>` +
      `<rect x='${x}' y='${top}' width='6' height='${112 - top}' fill='${c.paper}'/><path d='M${x} ${top + 20} h4 M${x + 2} ${top + 38} h4 M${x} ${top + 56} h5' stroke='${c.ink}' stroke-width='2'/>`;
    return [40, 96, 150, 250, 300, 356].map((x, i) => birch(x, 24 + (i % 3) * 12)).join("") + `<rect y='110' width='400' height='4' fill='${c.accent}' opacity='.5'/>`;
  },
  // France: the Eiffel Tower over Haussmann rooftops.
  FR: (c) =>
    g(c.accent, `<path d='M0 120 V96 L14 88 H70 L84 96 V120Z M300 120 V94 L316 86 H384 L400 94 V120Z' opacity='.5'/>`) +
    g(c.accent, `<path d='M176 112 Q188 78 195 42 L198 12 H202 L205 42 Q212 78 224 112 H210 Q205 92 200 92 Q195 92 190 112Z'/><rect x='184' y='70' width='32' height='4'/><rect x='191' y='44' width='18' height='3'/>`),
  // India: the Taj Mahal.
  IN: (c) =>
    g(
      c.accent,
      `<rect x='76' y='100' width='248' height='12'/><rect x='146' y='68' width='108' height='32'/><path d='M172 68 Q166 48 200 32 Q234 48 228 68Z'/><rect x='199' y='20' width='2' height='12'/>` +
        `<path d='M152 68 Q158 56 166 68Z'/><path d='M234 68 Q242 56 248 68Z'/>` +
        `<rect x='96' y='46' width='7' height='54'/><rect x='297' y='46' width='7' height='54'/><circle cx='99.5' cy='44' r='5'/><circle cx='300.5' cy='44' r='5'/>`
    ) +
    `<path d='M186 100 V82 Q200 68 214 82 V100Z' fill='${c.primary}'/>`,
};

export function landmarkSvg(code: string, c: Palette) {
  return (LANDMARKS[code] ?? LANDMARKS.XX)(c);
}
