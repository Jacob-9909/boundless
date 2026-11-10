// A member's cartoon avatar, assembled from Avataaars parts (DiceBear; design by Pablo Stanley, free for personal and
// commercial use). Only these choices are stored, never a photo: the builder reads colors from a photo on the device.
// Shared by the server (validation, rendering) and the builder in the browser.
import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";

export const SKINS = ["ffdbb4", "edb98a", "d08b5b", "ae5d29", "614335"];
export const HAIRS = ["2c1b18", "4a312c", "724133", "a55728", "b58143", "d6b370", "ecdcbf", "e8e1e1", "c93305", "f59797"];
export const COLORS = ["262e33", "3c4f5c", "25557c", "5199e4", "65c9ff", "a7ffc4", "ffffb1", "ffafb9", "ff5c5c", "e6e6e6"];
// Head coverings first: hijab and turban matter to many neighbors here.
export const COVERS = ["hijab", "turban", "hat", "winterHat1"];
export const TOPS = [
  ...COVERS,
  "none",
  "shortFlat",
  "shortRound",
  "shortWaved",
  "shortCurly",
  "theCaesar",
  "sides",
  "shavedSides",
  "frizzle",
  "fro",
  "dreads01",
  "bob",
  "bun",
  "curly",
  "curvy",
  "straight01",
  "straight02",
  "longButNotTooLong",
  "bigHair",
];
export const GLASSES = ["none", "prescription02", "round", "wayfarers", "sunglasses"];
export const BEARDS = ["none", "beardLight", "beardMedium", "beardMajestic", "moustacheFancy"];

export type Look = { skin: string; top: string; hair: string; cover: string; glasses: string; beard: string; clothes: string };

export const DEFAULT_LOOK: Look = { skin: SKINS[1], top: "shortRound", hair: HAIRS[0], cover: COLORS[2], glasses: "none", beard: "none", clothes: COLORS[3] };

/** Every field must be one of the lists above; anything else (including injected SVG) is refused. */
export function parseLook(v: unknown): Look | null {
  const o = v as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  const lists: [keyof Look, string[]][] = [
    ["skin", SKINS],
    ["top", TOPS],
    ["hair", HAIRS],
    ["cover", COLORS],
    ["glasses", GLASSES],
    ["beard", BEARDS],
    ["clothes", COLORS],
  ];
  const out = {} as Look;
  for (const [k, list] of lists) {
    if (typeof o[k] !== "string" || !list.includes(o[k] as string)) return null;
    out[k] = o[k] as string;
  }
  return out;
}

const cache = new Map<string, string>();

/** The avatar as an SVG data URI. ponytail: an in-memory cache per process; there are only so many looks. */
export function lookUri(l: Look) {
  const key = JSON.stringify(l);
  let uri = cache.get(key);
  if (!uri) {
    const off = (v: string) => (v === "none" ? { p: 0, v: undefined } : { p: 100, v: [v] });
    const top = off(l.top);
    const glasses = off(l.glasses);
    const beard = off(l.beard);
    uri = createAvatar(avataaars, {
      seed: "boundless",
      skinColor: [l.skin],
      top: top.v as never,
      topProbability: top.p,
      hairColor: [l.hair],
      hatColor: [l.cover],
      accessories: glasses.v as never,
      accessoriesProbability: glasses.p,
      facialHair: beard.v as never,
      facialHairProbability: beard.p,
      facialHairColor: [l.hair],
      clothing: ["shirtCrewNeck"],
      clothesColor: [l.clothes],
      eyes: ["default"],
      eyebrows: ["defaultNatural"],
      mouth: ["smile"],
    }).toDataUri();
    if (cache.size > 500) cache.clear();
    cache.set(key, uri);
  }
  return uri;
}

/* ---------- reading colors from a photo, on the device ---------- */

const rgb = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The palette color closest to an RGB sample (weighted for how eyes see red, green and blue). */
export function nearest(sample: number[], palette: string[]) {
  let best = palette[0];
  let bestD = Infinity;
  for (const hex of palette) {
    const [r, g, b] = rgb(hex);
    const d = 0.3 * (r - sample[0]) ** 2 + 0.59 * (g - sample[1]) ** 2 + 0.11 * (b - sample[2]) ** 2;
    if (d < bestD) [best, bestD] = [hex, d];
  }
  return best;
}
