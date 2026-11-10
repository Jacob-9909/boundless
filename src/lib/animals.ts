// Animal avatars drawn for Boundless (flat shapes on a 100x100 grid, no outlines), so anyone who would rather not be
// a person can be a cat or a penguin. No imports: src/lib/avatar.ts turns these into data URIs.

const INK = "#1f1a17";
const eye = (x: number, y: number, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + 1}" cy="${y - 1.1}" r="1.1" fill="#fff"/>`;
const eyes = (y: number, dx = 12, r?: number) => eye(50 - dx, y, r) + eye(50 + dx, y, r);
const mouth = (y: number, c = "#5b3a24") =>
  `<path d="M50 ${y} v2.6 M50 ${y + 2.6} q-3.2 3 -6.4 0 M50 ${y + 2.6} q3.2 3 6.4 0" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
const pair = (svg: (x: number, side: 1 | -1) => string, dx: number) => svg(50 - dx, -1) + svg(50 + dx, 1);

export const ANIMAL_ART: Record<string, string> = {
  cat:
    `<path d="M22 46 26 14 45 31Z" fill="#f4a259"/><path d="M78 46 74 14 55 31Z" fill="#f4a259"/>` +
    `<path d="M27 38 28.5 22 39 32Z" fill="#f9d1b0"/><path d="M73 38 71.5 22 61 32Z" fill="#f9d1b0"/>` +
    `<ellipse cx="50" cy="56" rx="32" ry="29" fill="#f4a259"/>` +
    `<path d="M44 30l3 8M50 28v9M56 30l-3 8" stroke="#d9822b" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="50" cy="66" rx="14" ry="10" fill="#fbe3cc"/>` +
    eyes(54) +
    `<path d="M47 61.5h6l-3 3.5z" fill="#e5737f"/>` +
    mouth(65, "#7a4a2a") +
    `<path d="M31 63H20M31 67l-9 3M69 63h11M69 67l9 3" stroke="#7a4a2a" stroke-width="1.3" stroke-linecap="round"/>`,
  dog:
    `<ellipse cx="50" cy="54" rx="29" ry="30" fill="#d9a066"/>` +
    `<path d="M25 33C10 39 12 66 22 71c8 2 8-20 11-31Z" fill="#8a5a2b"/><path d="M75 33c15 6 13 33 3 38-8 2-8-20-11-31Z" fill="#8a5a2b"/>` +
    `<path d="M46 26q4-4 8 0l2 32H44Z" fill="#fff4e6"/>` +
    `<ellipse cx="50" cy="67" rx="15" ry="11" fill="#fff4e6"/>` +
    eyes(51, 11) +
    `<ellipse cx="50" cy="61.5" rx="5.5" ry="4" fill="#2b211c"/>` +
    mouth(65.5, "#2b211c") +
    `<path d="M47 71.5q3 6 6 0z" fill="#ef7d8a"/>`,
  fox:
    `<path d="M20 46 22 12 44 32Z" fill="#e8742c"/><path d="M80 46 78 12 56 32Z" fill="#e8742c"/>` +
    `<path d="M24.5 37 25.5 20 36.5 31.5Z" fill="#3b2a24"/><path d="M75.5 37 74.5 20 63.5 31.5Z" fill="#3b2a24"/>` +
    `<path d="M18 48q2-22 32-22t32 22q-2 22-32 38Q20 70 18 48Z" fill="#e8742c"/>` +
    `<path d="M19 51q17 2 31 35Q26 75 19 51Z" fill="#fdf3ea"/><path d="M81 51q-17 2-31 35 24-11 31-35Z" fill="#fdf3ea"/>` +
    eyes(49) +
    `<ellipse cx="50" cy="76" rx="4.5" ry="3.4" fill="#2b211c"/>`,
  bear:
    pair((x) => `<circle cx="${x}" cy="30" r="11" fill="#8b5a3c"/><circle cx="${x}" cy="30" r="6" fill="#c08a64"/>`, 25) +
    `<circle cx="50" cy="55" r="31" fill="#8b5a3c"/>` +
    `<ellipse cx="50" cy="66" rx="14" ry="11" fill="#d4a77f"/>` +
    eyes(50) +
    `<ellipse cx="50" cy="61.5" rx="5" ry="3.6" fill="#2b211c"/>` +
    mouth(65, "#2b211c"),
  panda:
    pair((x) => `<circle cx="${x}" cy="29" r="10" fill="#222"/>`, 24) +
    `<circle cx="50" cy="55" r="31" fill="#fafafa"/>` +
    `<ellipse cx="37" cy="53" rx="8" ry="10.5" transform="rotate(-30 37 53)" fill="#222"/><ellipse cx="63" cy="53" rx="8" ry="10.5" transform="rotate(30 63 53)" fill="#222"/>` +
    pair((x) => `<circle cx="${x}" cy="51.5" r="3.2" fill="#fff"/><circle cx="${x + 0.5}" cy="51.8" r="1.7" fill="#222"/>`, 12.5) +
    `<ellipse cx="50" cy="64" rx="4.5" ry="3.2" fill="#222"/>` +
    mouth(67, "#222"),
  rabbit:
    pair((x) => `<ellipse cx="${x}" cy="22" rx="8" ry="22" fill="#ece8f2"/><ellipse cx="${x}" cy="24" rx="4" ry="15" fill="#f5b5c4"/>`, 12) +
    `<ellipse cx="50" cy="61" rx="28" ry="25" fill="#ece8f2"/>` +
    pair((x) => `<circle cx="${x}" cy="67" r="4" fill="#f5b5c4" opacity=".7"/>`, 17) +
    eyes(58, 10) +
    `<path d="M47 64h6l-3 3z" fill="#e5737f"/>` +
    mouth(67, "#8a7a8f") +
    `<rect x="47.6" y="70" width="4.8" height="5" rx="1" fill="#fff" stroke="#c9c2d4" stroke-width=".8"/>`,
  tiger:
    pair((x) => `<circle cx="${x}" cy="31" r="10" fill="#f08a24"/><circle cx="${x}" cy="31" r="5" fill="#fff3e0"/>`, 24) +
    `<ellipse cx="50" cy="56" rx="32" ry="29" fill="#f08a24"/>` +
    pair((x) => `<ellipse cx="${x}" cy="68" rx="12" ry="9" fill="#fff8ef"/>`, 12) +
    `<path d="M44 30l2 8M50 28v9M56 30l-2 8M19 52h8M20 59h7M81 52h-8M80 59h-7" stroke="#2b211c" stroke-width="2.6" stroke-linecap="round"/>` +
    eyes(52) +
    `<path d="M46 62h8l-4 4z" fill="#2b211c"/>` +
    mouth(66, "#2b211c"),
  koala:
    pair((x) => `<circle cx="${x}" cy="40" r="15" fill="#9aa3ad"/><circle cx="${x}" cy="40" r="9" fill="#e6e9ec"/>`, 28) +
    `<ellipse cx="50" cy="57" rx="29" ry="28" fill="#9aa3ad"/>` +
    eyes(52, 12) +
    `<ellipse cx="50" cy="64" rx="7" ry="9.5" fill="#3a3a44"/>` +
    `<path d="M45 77q5 3 10 0" stroke="#3a3a44" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  owl:
    `<path d="M20 40 26 17 40 30q10-4 20 0l14-13 6 23q4 40-30 46-34-6-30-46Z" fill="#9b6b43"/>` +
    `<ellipse cx="50" cy="52" rx="25" ry="20" fill="#d9b48c"/>` +
    pair((x) => `<circle cx="${x}" cy="50" r="10" fill="#fff"/><circle cx="${x}" cy="50" r="6" fill="#f2b632"/><circle cx="${x}" cy="50" r="3.4" fill="${INK}"/><circle cx="${x + 1.2}" cy="48.8" r="1.1" fill="#fff"/>`, 11) +
    `<path d="M46 58h8l-4 8z" fill="#f2a33a"/>` +
    `<path d="M40 75q3 3 6 0M54 75q3 3 6 0M47 80q3 3 6 0" stroke="#7a5233" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  penguin:
    `<ellipse cx="50" cy="54" rx="30" ry="31" fill="#2d3440"/>` +
    `<path d="M50 40c-8-10-26-4-24 14 2 18 16 26 24 26s22-8 24-26c2-18-16-24-24-14Z" fill="#fff"/>` +
    eyes(54, 10) +
    `<path d="M44 62q6-4 12 0-6 8-12 0Z" fill="#f59e2a"/>` +
    pair((x) => `<circle cx="${x}" cy="65" r="3.5" fill="#f7a8b8" opacity=".7"/>`, 17),
  monkey:
    pair((x) => `<circle cx="${x}" cy="54" r="10" fill="#8a5a3b"/><circle cx="${x}" cy="54" r="6" fill="#e8c39e"/>`, 30) +
    `<circle cx="50" cy="54" r="30" fill="#8a5a3b"/>` +
    `<path d="M50 44c-6-12-22-8-20 8-6 10 4 28 20 28s26-18 20-28c2-16-14-20-20-8Z" fill="#e8c39e"/>` +
    eyes(52, 9) +
    `<circle cx="47.5" cy="63" r="1.3" fill="#5b3a24"/><circle cx="52.5" cy="63" r="1.3" fill="#5b3a24"/>` +
    `<path d="M42 69q8 6 16 0" stroke="#5b3a24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  lion:
    Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `<circle cx="${(50 + 33 * Math.cos(a)).toFixed(1)}" cy="${(55 + 33 * Math.sin(a)).toFixed(1)}" r="11" fill="#b8682d"/>`;
    }).join("") +
    `<circle cx="50" cy="55" r="34" fill="#b8682d"/>` +
    pair((x) => `<circle cx="${x}" cy="34" r="7" fill="#f2c46d"/>`, 19) +
    `<circle cx="50" cy="57" r="25" fill="#f2c46d"/>` +
    `<ellipse cx="50" cy="67" rx="11" ry="8" fill="#fbe6b5"/>` +
    eyes(54, 10) +
    `<path d="M46 62h8l-4 4z" fill="#7a3f1d"/>` +
    mouth(66, "#7a3f1d"),
};

export const animalSvg = (id: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${ANIMAL_ART[id] ?? ""}</svg>`;
