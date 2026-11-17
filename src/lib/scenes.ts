// Culture scenes: each culture's banner is a place at the hour people remember it, not a wallpaper tile.
// Layers, back to front: a sky gradient (CSS), an "air" strip along the top (lanterns, clouds, an eagle),
// and the ground strip: far ridges in haze, the landmark from landmarks.ts as a silhouette, then a foreground.
// Signatures were picked from shared, secular heritage (see docs in the PR); religious and political symbols stay out.
// Boxes: air is 400x110 anchored to the top edge; ground is 400x136 anchored to the bottom, horizon near y=112.
import type { Palette } from "./cultures";
import { landmarkSvg } from "./landmarks";

export type Scene = {
  sky: [string, string, string]; // top, middle, horizon
  glow: string; // haze at the horizon
  mid: string; // landmark silhouette
  cut?: Partial<Palette>; // other landmark colors (lit windows, snow, a gold flame)
  far?: string; // behind the landmark
  near?: string; // in front of it, from y≈108 down
  air?: string;
};

const f = (n: number) => +n.toFixed(1);

/** Smooth hills through evenly spaced heights, filled down to the bottom of the ground box. */
function hills(ys: number[], fill: string, op = 1) {
  const step = 400 / (ys.length - 1);
  let d = `M0 136 L0 ${ys[0]}`;
  for (let i = 1; i < ys.length; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    d += ` C${f(x0 + step / 2)} ${ys[i - 1]} ${f(x1 - step / 2)} ${ys[i]} ${f(x1)} ${ys[i]}`;
  }
  return `<path d='${d} L400 136Z' fill='${fill}'${op < 1 ? ` opacity='${op}'` : ""}/>`;
}

/** Sharp ridgeline through [x, y] points. */
function peaks(pts: [number, number][], fill: string, op = 1) {
  return `<path d='M0 136 ${pts.map(([x, y]) => `L${x} ${y}`).join(" ")} L400 136Z' fill='${fill}'${op < 1 ? ` opacity='${op}'` : ""}/>`;
}

/** A soft light: rings of falling opacity, no gradients (ids collide across inline svgs). */
function glow(x: number, y: number, r: number, color: string, core = 1) {
  return [3.2, 2.2, 1.5].map((k, i) => `<circle cx='${x}' cy='${y}' r='${f(r * k)}' fill='${color}' opacity='${[0.06, 0.1, 0.16][i]}'/>`).join("") + `<circle cx='${x}' cy='${y}' r='${r}' fill='${color}' opacity='${core}'/>`;
}

/** Water from the horizon down, with light streaks. */
function water(color: string, shine: string, y = 112) {
  const streaks = [
    [40, 118, 30],
    [150, 124, 46],
    [262, 117, 26],
    [330, 128, 40],
    [96, 131, 22],
  ]
    .map(([x, yy, w]) => `<rect x='${x}' y='${yy}' width='${w}' height='1.6' rx='.8' fill='${shine}' opacity='.45'/>`)
    .join("");
  return `<rect x='0' y='${y}' width='400' height='${136 - y}' fill='${color}'/>${streaks}`;
}

/** The landmark mirrored into the water below the horizon (y=112). */
const reflect = (svg: string, op = 0.28) => `<g transform='translate(0 224) scale(1 -1)' opacity='${op}'>${svg}</g>`;

/** A point on a hanging string (quadratic sag between two pins). */
function onString(x1: number, x2: number, y: number, sag: number, t: number): [number, number] {
  const cx = (x1 + x2) / 2;
  const cy = y + sag * 2;
  const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
  const yy = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t ** 2 * y;
  return [f(x), f(yy)];
}
const stringPath = (x1: number, x2: number, y: number, sag: number, color: string, w = 1) =>
  `<path d='M${x1} ${y} Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}' fill='none' stroke='${color}' stroke-width='${w}'/>`;

/** Repeat a band ornament across the width (textile selvage along the bottom edge). */
const band = (y: number, h: number, bg: string, unit: (x: number) => string, w: number) =>
  `<rect x='0' y='${y}' width='400' height='${h}' fill='${bg}'/>` + Array.from({ length: Math.ceil(400 / w) + 1 }, (_, i) => unit(i * w)).join("");

/* ---------- signature drawings ---------- */

// Chinese palace lantern: red oval, gold cap and foot, a tassel.
const palaceLantern = (x: number, y: number, s: number) =>
  glow(x, y + 14 * s, 9 * s, "#FFB347", 0) +
  `<line x1='${x}' y1='${y - 6 * s}' x2='${x}' y2='${y}' stroke='#E8B33A' stroke-width='${s}'/>` +
  `<rect x='${f(x - 5 * s)}' y='${y}' width='${f(10 * s)}' height='${f(3 * s)}' fill='#E8B33A'/>` +
  `<ellipse cx='${x}' cy='${f(y + 14 * s)}' rx='${f(12 * s)}' ry='${f(11.5 * s)}' fill='#D7262E'/>` +
  `<path d='M${x} ${f(y + 3 * s)} Q${f(x - 7 * s)} ${f(y + 14 * s)} ${x} ${f(y + 25 * s)} M${x} ${f(y + 3 * s)} Q${f(x + 7 * s)} ${f(y + 14 * s)} ${x} ${f(y + 25 * s)}' fill='none' stroke='#9E1420' stroke-width='${f(0.8 * s)}'/>` +
  `<rect x='${f(x - 5 * s)}' y='${f(y + 24.5 * s)}' width='${f(10 * s)}' height='${f(3 * s)}' fill='#E8B33A'/>` +
  `<path d='M${f(x - 2 * s)} ${f(y + 27.5 * s)} h${f(4 * s)} l${f(1.5 * s)} ${f(10 * s)} h${f(-7 * s)}Z' fill='#E8B33A' opacity='.9'/>`;

// Xiangyun, the auspicious cloud: a spiral head with a trailing tail.
const xiangyun = (x: number, y: number, s: number, color: string) =>
  `<path d='M${x} ${y} c${-8 * s} 0 ${-8 * s} ${-10 * s} 0 ${-10 * s} c${6 * s} 0 ${6 * s} ${7 * s} 0 ${7 * s} M${x} ${y} h${30 * s} c${7 * s} 0 ${7 * s} ${-9 * s} 0 ${-9 * s} c${-5 * s} 0 ${-5 * s} ${6 * s} 0 ${6 * s} M${x + 30 * s} ${y} h${18 * s}' fill='none' stroke='${color}' stroke-width='${f(2.2 * s)}' stroke-linecap='round'/>`;

// Hội An silk lanterns: round, diamond and "garlic" shapes in bright silk, glowing.
function hoiAn(x: number, y: number, s: number, color: string, shape: number) {
  const top = `<line x1='${x}' y1='${y - 5 * s}' x2='${x}' y2='${y}' stroke='#2E1A14' stroke-width='${f(0.8 * s)}'/><rect x='${f(x - 3 * s)}' y='${y}' width='${f(6 * s)}' height='${f(2 * s)}' fill='#5A2E12'/>`;
  const cy = y + 2 * s + 10 * s;
  const body =
    shape === 0
      ? `<ellipse cx='${x}' cy='${f(cy)}' rx='${f(9 * s)}' ry='${f(10 * s)}' fill='${color}'/>`
      : shape === 1
        ? `<path d='M${x} ${f(y + 2 * s)} L${f(x + 9 * s)} ${f(cy)} L${x} ${f(cy + 10 * s)} L${f(x - 9 * s)} ${f(cy)}Z' fill='${color}'/>`
        : `<path d='M${x} ${f(y + 2 * s)} C${f(x + 12 * s)} ${f(y + 6 * s)} ${f(x + 11 * s)} ${f(cy + 8 * s)} ${x} ${f(cy + 10 * s)} C${f(x - 11 * s)} ${f(cy + 8 * s)} ${f(x - 12 * s)} ${f(y + 6 * s)} ${x} ${f(y + 2 * s)}Z' fill='${color}'/>`;
  const ribs = `<path d='M${x} ${f(y + 2 * s)} V${f(cy + 10 * s)}' stroke='#5A2E12' stroke-width='${f(0.6 * s)}' opacity='.5'/>`;
  const tassel = `<path d='M${x} ${f(cy + 10 * s)} v${f(7 * s)}' stroke='${color}' stroke-width='${f(1.6 * s)}'/>`;
  return glow(x, cy, 7 * s, color, 0) + top + body + ribs + tassel;
}

// Khom loi: a paper sky lantern rising, lit from inside.
const khomLoi = (x: number, y: number, s: number) =>
  glow(x, y, 6 * s, "#FFC861", 0) + `<path d='M${f(x - 5 * s)} ${f(y - 7 * s)} H${f(x + 5 * s)} L${f(x + 4 * s)} ${f(y + 6 * s)} H${f(x - 4 * s)}Z' fill='#FFD27A'/><rect x='${f(x - 4 * s)}' y='${f(y + 4.5 * s)}' width='${f(8 * s)}' height='${f(1.5 * s)}' fill='#FFF3C4'/>`;

// Megamendung: a Cirebon batik cloud. One cloud outline drawn as stacked strokes, widest and darkest first,
// so the bands step evenly from deep indigo at the edge to pale blue at the heart, as in the cloth.
function megamendung(x: number, y: number, s: number) {
  const d = "M0 20 C8 20 12 9 24 11 C27 -1 47 -4 54 7 C60 -6 84 -5 87 9 C99 4 112 13 106 22 C116 24 117 33 109 35 H9 C-3 35 -5 22 0 20Z";
  const shades = ["#102A55", "#1C4686", "#2F66AA", "#5D8FCB", "#A9C6E8"];
  const at = `transform='translate(${x} ${y}) scale(${s})' stroke-linejoin='round'`;
  return shades.map((c, i) => `<path d='${d}' ${at} fill='none' stroke='${c}' stroke-width='${(5 - i) * 4.4}'/>`).join("") + `<path d='${d}' ${at} fill='#E6EFF9'/>`;
}

// Sugar palm (tnaôt), Cambodia's national tree: a thin trunk with a round burst of fronds.
const sugarPalm = (x: number, top: number, color: string) =>
  `<path d='M${x} 113 Q${x + 2} ${(113 + top) / 2} ${x} ${top}' fill='none' stroke='${color}' stroke-width='2.4'/>` +
  Array.from({ length: 11 }, (_, i) => {
    const a = (Math.PI * (i + 0.5)) / 11 + Math.PI;
    return `<path d='M${x} ${top} L${f(x + 15 * Math.cos(a))} ${f(top + 13 * Math.sin(a) + 4)}' stroke='${color}' stroke-width='2.2' stroke-linecap='round'/>`;
  }).join("") +
  `<circle cx='${x}' cy='${top + 1}' r='4' fill='${color}'/>`;

// Steppe eagle, wings spread (the eagle under the sun on Kazakhstan's flag).
const eagle = (x: number, y: number, s: number, color: string) =>
  `<path d='M${x} ${y} C${x - 10 * s} ${y - 8 * s} ${x - 22 * s} ${y - 8 * s} ${x - 34 * s} ${y - 2 * s} C${x - 24 * s} ${y - 2 * s} ${x - 16 * s} ${y + 1 * s} ${x - 8 * s} ${y + 4 * s} L${x - 4 * s} ${y + 10 * s} L${x} ${y + 7 * s} L${x + 4 * s} ${y + 10 * s} L${x + 8 * s} ${y + 4 * s} C${x + 16 * s} ${y + 1 * s} ${x + 24 * s} ${y - 2 * s} ${x + 34 * s} ${y - 2 * s} C${x + 22 * s} ${y - 8 * s} ${x + 10 * s} ${y - 8 * s} ${x} ${y}Z' fill='${color}'/>`;

// A horse at full gallop, for the Mongolian herd.
const horse = (x: number, y: number, s: number, color: string) =>
  `<path transform='translate(${x} ${y}) scale(${s})' d='M0 0 C4 -3 12 -3 16 -1 L20 -6 L23 -6 L22 -2 L26 1 L24 2 L19 0 C18 4 16 6 14 7 L18 13 L16 13 L11 8 L5 8 L1 13 L-1 13 L2 7 C-1 6 -3 4 -4 2 L-9 5 L-8 3 Z' fill='${color}'/>`;

// Marigold garland swag with mango leaves between the strands.
function toran(color1: string, color2: string) {
  let out = "";
  for (let i = 0; i < 4; i++) {
    const x1 = i * 100;
    const x2 = x1 + 100;
    for (let k = 0; k <= 16; k++) {
      const [x, y] = onString(x1, x2, 6, 12, k / 16);
      out += `<circle cx='${x}' cy='${y}' r='3.6' fill='${k % 2 ? color1 : color2}'/>`;
    }
    out += `<path d='M${x1 + 50} 30 v12' stroke='${color1}' stroke-width='3' stroke-dasharray='3 1.5'/><circle cx='${x1 + 50}' cy='45' r='3' fill='${color2}'/>`;
  }
  // mango leaves along the top cord
  out += Array.from({ length: 21 }, (_, i) => `<path d='M${i * 20} 2 q4 9 0 14 q-4 -5 0 -14Z' fill='#2F6B2F'/>`).join("");
  return `<rect width='400' height='3' fill='#5A2E12'/>` + out;
}

// A scalloped bistro awning valance in red and cream stripes.
const awning = (a: string, b: string) =>
  Array.from({ length: 20 }, (_, i) => `<path d='M${i * 20} 0 H${i * 20 + 20} V16 A10 10 0 0 1 ${i * 20} 16Z' fill='${i % 2 ? a : b}'/>`).join("") + `<rect width='400' height='3' fill='#121A33' opacity='.35'/>`;

// Seigaiha: rows of concentric wave arcs.
function seigaiha(y0: number, fill: string, line: string) {
  let out = `<rect x='0' y='${y0}' width='400' height='${136 - y0}' fill='${fill}'/>`;
  for (let row = 0; row < 4; row++) {
    const y = y0 + 6 + row * 7;
    for (let i = -1; i < 22; i++) {
      const x = i * 20 + (row % 2) * 10;
      out += `<circle cx='${x}' cy='${y + 10}' r='10' fill='${fill}'/>` + [10, 7, 4].map((r) => `<path d='M${x - r} ${y + 10} A${r} ${r} 0 0 1 ${x + r} ${y + 10}' fill='none' stroke='${line}' stroke-width='1'/>`).join("");
    }
  }
  return out;
}

// Kasumi: the long rounded mist bands of Japanese screen painting.
const kasumi = (bands: [number, number, number][], color: string) => bands.map(([x, y, w]) => `<rect x='${x}' y='${y}' width='${w}' height='9' rx='4.5' fill='${color}' opacity='.55'/>`).join("");

const snow = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const x = (i * 97 + seed * 31) % 400;
    const y = (i * 53 + seed * 17) % 108;
    return `<circle cx='${x}' cy='${y}' r='${(i % 3) * 0.6 + 0.8}' fill='#fff' opacity='${0.35 + (i % 4) * 0.15}'/>`;
  }).join("");

const stars = (n: number) =>
  Array.from({ length: n }, (_, i) => `<circle cx='${(i * 89 + 13) % 400}' cy='${(i * 41 + 7) % 96}' r='${i % 5 ? 0.7 : 1.2}' fill='#fff' opacity='${0.3 + (i % 3) * 0.2}'/>`).join("");

const birds = (pts: [number, number, number][], color: string) =>
  pts.map(([x, y, s]) => `<path d='M${x - 5 * s} ${y} q${2.5 * s} ${-3 * s} ${5 * s} 0 q${2.5 * s} ${-3 * s} ${5 * s} 0' fill='none' stroke='${color}' stroke-width='1.2' stroke-linecap='round'/>`).join("");

/* ---------- the scenes ---------- */

const METRO = ["#0052A4", "#00A84D", "#EF7C1C", "#00A5DE", "#996CAC", "#E6186C"];

export const SCENES: Record<string, Scene> = {
  // Seoul at blue hour: Bukhansan behind, the Han river and its bridge lights, metro lines overhead.
  XX: {
    sky: ["#0E1B33", "#1B3A6B", "#5C8CC4"],
    glow: "#8CC4F2",
    mid: "#0B1730",
    far: hills([86, 72, 80, 62, 76, 70, 84], "#2C4F86", 0.8) + peaks([[0, 96], [60, 78], [92, 86], [140, 66], [180, 84], [240, 74], [300, 88], [350, 76], [400, 90]], "#1E3C6E"),
    near: water("#13284D", "#FFC861") + `<rect x='0' y='108' width='400' height='4' fill='#0B1730'/>` + Array.from({ length: 13 }, (_, i) => `<circle cx='${i * 32 + 8}' cy='108' r='1.4' fill='#FFC861'/>`).join(""),
    air: METRO.map((c, i) => `<path d='M${-20 + i * 14} ${-4} C${80 + i * 20} ${40 + i * 6} ${260 - i * 10} ${10 + i * 8} ${420} ${34 + i * 7}' fill='none' stroke='${c}' stroke-width='3' stroke-linecap='round' opacity='.75'/>`).join("") + [[96, 34], [214, 30], [318, 40]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='4' fill='#F3F6FB' stroke='#0E1B33' stroke-width='2'/>`).join(""),
  },
  // Dusk over layered shanshui ridges, the Great Wall in silhouette, palace lanterns and auspicious clouds.
  CN: {
    sky: ["#4A0812", "#B3122B", "#F59A45"],
    glow: "#FFC861",
    mid: "#3A0D0D",
    far: glow(300, 74, 16, "#FFE2A0") + hills([70, 54, 66, 48, 62, 56, 68], "#C9603A", 0.55) + hills([88, 74, 84, 68, 80, 72, 86], "#8E2A24", 0.8),
    near: `<rect x='0' y='110' width='400' height='26' fill='#3A0D0D'/>` + `<path d='M0 120 H400' stroke='#E8B33A' stroke-width='1' opacity='.35'/>`,
    air: palaceLantern(34, 8, 1.15) + palaceLantern(78, 2, 0.85) + palaceLantern(322, 2, 0.85) + palaceLantern(366, 8, 1.15) + xiangyun(150, 46, 1, "#E8B33A") + xiangyun(232, 30, 0.8, "#E8B33A"),
  },
  // Hội An at dusk: Ha Long karsts in mist, a junk on the water, strings of silk lanterns overhead.
  VN: {
    sky: ["#2A1838", "#A8242B", "#F6A65A"],
    glow: "#FFD58A",
    mid: "#2E1A14",
    far: glow(210, 80, 14, "#FFE3A8") + peaks([[0, 92], [30, 64], [56, 90], [118, 58], [150, 88], [214, 70], [240, 92], [300, 62], [336, 90], [380, 70], [400, 86]], "#C2604A", 0.5),
    near: water("#3B1E24", "#FFD58A", 110) + reflect(`<path d='M232 104 H292 L282 112 H242Z' fill='#2E1A14'/>`, 0.4),
    air:
      stringPath(-10, 190, 4, 10, "#2E1A14") +
      stringPath(210, 410, 4, 10, "#2E1A14") +
      [0.12, 0.3, 0.5, 0.7, 0.88].map((t, i) => { const [x, y] = onString(-10, 190, 4, 10, t); return hoiAn(x, y, [1, 0.8, 1.1, 0.8, 1][i], ["#E8343B", "#F5B82E", "#E4508A", "#3E9C5A", "#F07A2A"][i], i % 3); }).join("") +
      [0.12, 0.3, 0.5, 0.7, 0.88].map((t, i) => { const [x, y] = onString(210, 410, 4, 10, t); return hoiAn(x, y, [0.9, 1.1, 0.8, 1, 0.85][i], ["#F5B82E", "#E8343B", "#3E9C5A", "#E4508A", "#F5B82E"][i], (i + 1) % 3); }).join(""),
  },
  // Night of Loy Krathong and Yi Peng: sky lanterns rising, a sala on the riverbank, krathong floats below.
  TH: {
    sky: ["#120826", "#4B2A82", "#B784CF"],
    glow: "#FFC861",
    mid: "#1A0B33",
    far: glow(330, 34, 9, "#FFF1C2") + hills([96, 90, 98, 86, 94, 88, 96], "#2D1752", 0.85),
    near: water("#1E0F3A", "#FFC861", 112) + [60, 128, 300, 352].map((x, i) => glow(x, 118 + (i % 2) * 6, 2.4, "#FFC861") + `<path d='M${x - 6} ${120 + (i % 2) * 6} h12 l-2 3 h-8Z' fill='#3E7C4A'/>`).join(""),
    air: stars(26) + [[40, 70, 1.2], [92, 40, 0.9], [150, 82, 1.4], [210, 30, 0.8], [262, 64, 1.1], [310, 22, 0.7], [356, 76, 1.3], [120, 18, 0.6], [384, 36, 0.8]].map(([x, y, s]) => khomLoi(x, y, s)).join(""),
  },
  // San Francisco at sunset: the Golden Gate in its international orange, fog rolling under the deck.
  US: {
    sky: ["#1F3A93", "#D9645A", "#F9C27A"],
    glow: "#FFD9A0",
    mid: "#B8352B",
    cut: { primary: "#B8352B" },
    far: glow(160, 82, 15, "#FFE6B8") + hills([84, 70, 78, 92, 92, 90, 74, 66], "#6E4C7A", 0.75),
    near: water("#2B3F7A", "#FFD9A0", 112) + [[-20, 100, 180], [120, 106, 200], [250, 98, 190]].map(([x, y, w]) => `<rect x='${x}' y='${y}' width='${w}' height='10' rx='5' fill='#FFF4E6' opacity='.55'/>`).join(""),
    air: birds([[70, 40, 1], [86, 48, 0.8], [300, 30, 1.1], [318, 38, 0.8]], "#2A1F3D"),
  },
  // Samarkand at golden hour: Registan's portals glowing, a suzani rosette for a sun, a suzani vine overhead.
  UZ: {
    sky: ["#0B4F5C", "#2E9C9A", "#F2C46B"],
    glow: "#FFE3A0",
    mid: "#0B2A3C",
    cut: { primary: "#F7D27A", extra: "#7FD3CF" },
    far:
      `<g transform='translate(266 26) scale(.8)'>` +
      Array.from({ length: 12 }, (_, i) => `<ellipse cx='0' cy='-13' rx='4.5' ry='9' fill='#E8B23A' transform='rotate(${i * 30})'/>`).join("") +
      `<circle r='9' fill='#C8443A'/><circle r='4.5' fill='#E8B23A'/></g>` +
      hills([96, 90, 94, 88, 92, 90, 96], "#5E8E7A", 0.6),
    near: band(112, 24, "#0B2A3C", (x) => `<path d='M${x} 124 l8 -8 l8 8 l-8 8Z' fill='#7FD3CF' opacity='.8'/><circle cx='${x + 8}' cy='124' r='2.5' fill='#E8B23A'/>`, 16),
    air: `<path d='M0 14 C40 30 60 0 100 14 S160 30 200 14 S260 0 300 14 S360 30 400 14' fill='none' stroke='#0B6E73' stroke-width='2.5'/>` + [50, 150, 250, 350].map((x) => `<circle cx='${x}' cy='${x % 200 === 50 ? 22 : 8}' r='7' fill='#C8443A'/><circle cx='${x}' cy='${x % 200 === 50 ? 22 : 8}' r='3' fill='#E8B23A'/>`).join("") + [0, 100, 200, 300, 400].map((x) => `<path d='M${x} 14 q6 -10 12 -4 q-4 6 -12 4Z' fill='#3E9C5A'/>`).join(""),
  },
  // The eternal blue sky at midday: white gers with red doors, the Altai behind, a herd at full gallop.
  MN: {
    sky: ["#0A3F8A", "#2F7FD6", "#B5DAF6"],
    glow: "#FFFFFF",
    mid: "#F4F8FC",
    cut: { primary: "#C4272F" },
    far: peaks([[0, 80], [50, 58], [80, 70], [130, 44], [170, 66], [220, 52], [270, 72], [320, 48], [360, 68], [400, 60]], "#7AA6D8", 0.85) + peaks([[110, 52], [130, 44], [150, 52]], "#FFFFFF", 0.9) + hills([104, 96, 102, 94, 100, 96, 104], "#5E9A55"),
    near: `<rect x='0' y='111' width='400' height='25' fill='#4E8B4A'/>` + [[112, 118, 1.3], [150, 113, 1.45], [194, 120, 1.25], [236, 115, 1.5], [278, 121, 1.2]].map(([x, y, s]) => horse(x, y, s, "#3A2414")).join(""),
    air: [[60, 30, 1], [250, 18, 0.8], [350, 44, 1.2]].map(([x, y, s]) => `<g fill='#fff' opacity='.9'><ellipse cx='${x}' cy='${y}' rx='${24 * s}' ry='${7 * s}'/><ellipse cx='${x - 8 * s}' cy='${y - 5 * s}' rx='${10 * s}' ry='${7 * s}'/><ellipse cx='${x + 8 * s}' cy='${y - 6 * s}' rx='${12 * s}' ry='${8 * s}'/></g>`).join(""),
  },
  // Sunset on the Banaue rice terraces: water in the paddies catching the light, a jeepney on the road.
  PH: {
    sky: ["#0A2E8A", "#E0603A", "#FCD116"],
    glow: "#FFE27A",
    mid: "#173E2A",
    cut: { primary: "#FCD116" },
    far:
      `<g transform='translate(110 70)'>${Array.from({ length: 8 }, (_, i) => `<path d='M0 -14 L3 -26 L0 -22 L-3 -26Z' fill='#FCD116' transform='rotate(${i * 45})'/>`).join("")}<circle r='12' fill='#FCD116'/></g>` +
      peaks([[0, 84], [60, 62], [110, 80], [170, 54], [230, 78], [290, 58], [350, 76], [400, 66]], "#4A3A6A", 0.7),
    near: `<rect x='0' y='110' width='400' height='26' fill='#173E2A'/>` + [114, 120, 127].map((y, i) => `<path d='M0 ${y} Q100 ${y - 4} 200 ${y} T400 ${y}' fill='none' stroke='#FFE27A' stroke-width='1.2' opacity='${0.6 - i * 0.12}'/>`).join(""),
    air: birds([[260, 36, 1], [276, 30, 0.8], [292, 40, 0.9]], "#0A1E4A") + [[330, 18], [352, 30], [374, 16]].map(([x, y]) => `<polygon points='${x},${y - 4} ${x + 1.2},${y - 1.2} ${x + 4},${y - 1.2} ${x + 1.8},${y + 0.8} ${x + 2.6},${y + 4} ${x},${y + 2} ${x - 2.6},${y + 4} ${x - 1.8},${y + 0.8} ${x - 4},${y - 1.2} ${x - 1.2},${y - 1.2}' fill='#FCD116' opacity='.9'/>`).join(""),
  },
  // Dawn on the Himalaya: alpenglow on the snow, a pagoda roofline, dhaka cloth along the bottom.
  NP: {
    sky: ["#1B2A5C", "#7A4A8C", "#F4A59A"],
    glow: "#FFD9B0",
    mid: "#3A1A3A",
    cut: { paper: "#FBE3E0" },
    far:
      peaks([[0, 70], [40, 52], [70, 62], [120, 20], [150, 40], [200, 8], [250, 36], [290, 24], [340, 56], [400, 44]], "#C99AB4") +
      peaks([[100, 34], [120, 20], [140, 34], [128, 30]], "#FFE8E4") +
      peaks([[182, 22], [200, 8], [218, 22], [206, 18]], "#FFE8E4"),
    near: band(116, 20, "#1B2A5C", (x) => `<path d='M${x} 126 l7 -7 l7 7 l-7 7Z' fill='#B0122B'/><path d='M${x + 7} 122 l3 4 l-3 4 l-3 -4Z' fill='#F4C542'/><rect x='${x}' y='117' width='14' height='1.5' fill='#F4C542' opacity='.7'/><rect x='${x}' y='133.5' width='14' height='1.5' fill='#F4C542' opacity='.7'/>`, 14),
    air: stars(10) + birds([[300, 50, 1], [316, 44, 0.8]], "#2A0A10"),
  },
  // Jakarta in the afternoon: Monas with its gold-leaf flame, megamendung clouds, kawung batik at the edge.
  ID: {
    sky: ["#1B3A6B", "#4E7FB8", "#EBCB9C"],
    glow: "#FFE3B0",
    mid: "#2B1A10",
    cut: { extra: "#F2B33A" },
    far: hills([98, 90, 96, 86, 94, 88, 98], "#6E5A4A", 0.55),
    near: band(114, 22, "#6E4123", (x) => `<g fill='#E9C99A'><ellipse cx='${x + 11}' cy='${119}' rx='3' ry='5'/><ellipse cx='${x + 11}' cy='${131}' rx='3' ry='5'/><ellipse cx='${x + 5}' cy='125' rx='5' ry='3'/><ellipse cx='${x + 17}' cy='125' rx='5' ry='3'/></g><circle cx='${x + 11}' cy='125' r='1.6' fill='#2B1A10'/>`, 22),
    air: megamendung(196, 22, 1) + megamendung(316, 58, 0.62),
  },
  // Dawn on Fuji: a red sun low in the sky, gold kasumi mist bands, seigaiha waves in front.
  JP: {
    sky: ["#1F3A5F", "#8FA9C8", "#F6CBAA"],
    glow: "#FFE6CC",
    mid: "#24466F",
    cut: { paper: "#F8F5EE" },
    far: `<circle cx='300' cy='46' r='16' fill='#D9381E'/>` + hills([96, 90, 94, 100, 98, 92, 96], "#7A92B2", 0.7),
    near: kasumi([[96, 74, 120], [196, 84, 150], [20, 92, 110]], "#E9C27A") + seigaiha(108, "#1F3A5F", "#9DB4CF"),
  },
  // Sunrise at Angkor Wat: the towers mirrored in the moat, sugar palms either side, lotus on the water.
  KH: {
    sky: ["#1D3F8F", "#C77D8F", "#F6C98A"],
    glow: "#FFE3A8",
    mid: "#16213D",
    cut: { extra: "#16213D" },
    far: glow(200, 30, 12, "#FFE9B8"),
    near: water("#3A3F6E", "#FFE3A8", 112) + sugarPalm(30, 54, "#16213D") + sugarPalm(56, 70, "#16213D") + sugarPalm(358, 50, "#16213D") + sugarPalm(382, 66, "#16213D") + [[110, 124], [150, 130], [270, 126], [300, 131]].map(([x, y]) => `<ellipse cx='${x}' cy='${y}' rx='8' ry='2.4' fill='#3E7C4A'/><path d='M${x + 2} ${y - 1} q2 -6 4 0' fill='#F2A7B5'/>`).join(""),
    air: birds([[96, 40, 1], [112, 34, 0.8], [290, 46, 0.9]], "#16213D"),
  },
  // The steppe under Kazakhstan's sky: the golden sun with the steppe eagle beneath it, Baiterek, koshkar-muiz.
  KZ: {
    sky: ["#00799A", "#3FB3CF", "#C4ECF5"],
    glow: "#FFF3B0",
    mid: "#063645",
    cut: { extra: "#F2C200" },
    far: peaks([[0, 86], [60, 70], [110, 82], [170, 62], [230, 80], [290, 66], [350, 82], [400, 72]], "#8FCFE0", 0.9) + peaks([[150, 70], [170, 62], [190, 70]], "#FFFFFF", 0.9) + hills([104, 98, 102, 96, 100, 98, 104], "#B9A24A", 0.7),
    near: band(114, 22, "#063645", (x) => `<path d='M${x + 12} 132 V124 C${x + 12} 118 ${x + 6} 116 ${x + 4} 120 C${x + 2} 123 ${x + 5} 126 ${x + 7} 124 M${x + 12} 124 C${x + 12} 118 ${x + 18} 116 ${x + 20} 120 C${x + 22} 123 ${x + 19} 126 ${x + 17} 124' fill='none' stroke='#F2C200' stroke-width='1.6' stroke-linecap='round'/>`, 24),
    air: glow(250, 26, 12, "#F2C200") + Array.from({ length: 16 }, (_, i) => { const a = (Math.PI * 2 * i) / 16; return `<path d='M${f(250 + 15 * Math.cos(a))} ${f(26 + 15 * Math.sin(a))} L${f(250 + 21 * Math.cos(a))} ${f(26 + 21 * Math.sin(a))}' stroke='#F2C200' stroke-width='2' stroke-linecap='round'/>`; }).join("") + eagle(250, 64, 1, "#F2C200"),
  },
  // A winter evening: snow falling on a birch grove, fir forest behind, drifts in the foreground.
  RU: {
    sky: ["#0F1F3D", "#1E4BA0", "#A9C2EA"],
    glow: "#DCE7F7",
    mid: "#C3D3EC",
    cut: { paper: "#F7F9FD", ink: "#0F1F3D" },
    far: Array.from({ length: 20 }, (_, i) => { const x = i * 21 + 6; const h = 26 + (i % 4) * 6; return `<path d='M${x} ${110 - h} L${x + 9} 110 H${x - 9}Z' fill='#3C5E96' opacity='.75'/>`; }).join(""),
    near: hills([112, 116, 110, 114, 111, 115], "#F7F9FD") + `<path d='M0 122 Q100 116 200 122 T400 120' fill='none' stroke='#A9C2EA' stroke-width='2' opacity='.7'/>`,
    air: snow(60, 3),
  },
  // Paris at blue hour: zinc rooftops with lit windows, the tower, the Seine, a bistro awning overhead.
  FR: {
    sky: ["#121A33", "#1D3C8F", "#E2A49C"],
    glow: "#FFD2C0",
    mid: "#0E1530",
    far:
      [[0, 60], [62, 70], [124, 56], [236, 64], [292, 58], [348, 52]].map(([x, w]) => `<path d='M${x} 112 V92 L${x + 8} 84 H${x + w - 8} L${x + w} 92 V112Z' fill='#33447A'/><rect x='${x + 10}' y='78' width='5' height='8' fill='#33447A'/>${[0, 1, 2].map((k) => `<rect x='${x + 8 + k * ((w - 16) / 3)}' y='98' width='4' height='6' fill='#FFC861' opacity='${0.5 + ((x + k) % 3) * 0.2}'/>`).join("")}`).join(""),
    near: water("#16224A", "#FFC861", 112),
    air: awning("#D72631", "#F4F1EA"),
  },
  // Dawn at the Taj Mahal: the marble lit warm, cypress along the reflecting pool, a marigold garland overhead.
  IN: {
    sky: ["#3A1A0A", "#B0501E", "#FFC27A"],
    glow: "#FFE2B0",
    mid: "#FBE6CF",
    cut: { primary: "#B0501E" },
    far: glow(330, 70, 10, "#FFF0D0"),
    near:
      water("#6A2E14", "#FFE2B0", 112) +
      [60, 92, 308, 340].map((x) => `<ellipse cx='${x}' cy='96' rx='5' ry='17' fill='#1F4A2E'/>`).join(""),
    air: toran("#F28C1E", "#FFC21E"),
  },
};

/** The ground strip markup: far layer, the landmark in scene colors, the foreground. */
export function groundSvg(code: string, c: Palette) {
  const s = SCENES[code] ?? SCENES.XX;
  const lm = landmarkSvg(code, { ...c, accent: s.mid, ...s.cut });
  const mirrored = code === "KH" || code === "IN" ? reflect(lm, code === "KH" ? 0.35 : 0.3) : "";
  // The foreground goes under the reflection, which goes under nothing: water first, then the mirrored towers.
  if (mirrored) return (s.far ?? "") + lm + (s.near ?? "") + mirrored;
  return (s.far ?? "") + lm + (s.near ?? "");
}

export function sceneOf(code: string) {
  return SCENES[code] ?? SCENES.XX;
}
