// A member's cartoon avatar: a person assembled from Avataaars parts (DiceBear; design by Pablo Stanley, free for
// personal and commercial use) or one of our own animals (src/lib/animals.ts). Only these choices are stored, never
// a photo: the builder reads colors from a photo on the device. Shared by the server (validation, rendering) and the
// builder in the browser.
import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";
// .ts so scripts/avatar-check.mjs can load this file with plain Node.
import { ANIMAL_ART, animalSvg } from "./animals.ts";

// A wide range on purpose: this is a community of every nationality.
export const SKINS = ["fde7d6", "f9d4b8", "f1c19b", "e2a77e", "d08b5b", "b8763f", "a0633a", "8a5133", "6b3f2a", "4a2b1f"];
export const HAIRS = ["1a1414", "3b2a24", "6a4630", "8b4a2b", "a55728", "b58143", "e2c27c", "ecdcbf", "9e9e9e", "e8e1e1", "c93305", "f59797", "5b7cfa", "8e5bd6"];
export const COLORS = ["262e33", "3c4f5c", "25557c", "5199e4", "65c9ff", "a7ffc4", "6b7f3a", "d9a441", "ffffb1", "ffafb9", "ff5c5c", "8c2f39", "f3ead8", "e6e6e6"];
// Head coverings first: hijab and turban matter to many neighbors here.
export const COVERS = ["hijab", "turban", "hat", "winterHat1", "winterHat02", "winterHat03", "winterHat04"];
export const TOPS = [
  ...COVERS,
  "none",
  "shortFlat",
  "shortRound",
  "shortWaved",
  "shortCurly",
  "theCaesar",
  "theCaesarAndSidePart",
  "sides",
  "shavedSides",
  "frizzle",
  "shaggy",
  "shaggyMullet",
  "fro",
  "froBand",
  "dreads",
  "dreads01",
  "dreads02",
  "bob",
  "bun",
  "curly",
  "curvy",
  "frida",
  "miaWallace",
  "straight01",
  "straight02",
  "straightAndStrand",
  "longButNotTooLong",
  "bigHair",
];
export const GLASSES = ["none", "prescription01", "prescription02", "round", "kurt", "wayfarers", "sunglasses"];
export const BEARDS = ["none", "beardLight", "beardMedium", "beardMajestic", "moustacheFancy", "moustacheMagnum"];
// graphicShirt is left out: some of its prints (skulls, slogans) do not suit an avatar picked in one tap.
export const OUTFITS = ["shirtCrewNeck", "shirtVNeck", "shirtScoopNeck", "hoodie", "collarAndSweater", "blazerAndShirt", "blazerAndSweater", "overall"];
export const FACES: Record<string, { eyes: string; mouth: string; eyebrows: string }> = {
  smile: { eyes: "default", mouth: "smile", eyebrows: "defaultNatural" },
  happy: { eyes: "happy", mouth: "smile", eyebrows: "raisedExcitedNatural" },
  wink: { eyes: "wink", mouth: "twinkle", eyebrows: "defaultNatural" },
  calm: { eyes: "default", mouth: "default", eyebrows: "flatNatural" },
};
export const ANIMALS = Object.keys(ANIMAL_ART);
export const BACKDROPS = ["fde2e4", "ffe4cc", "fff1c1", "dff5e1", "e0f2f1", "dbeafe", "ede9fe", "f1f5f9"];

export type Person = {
  kind: "person";
  skin: string;
  top: string;
  hair: string;
  cover: string;
  glasses: string;
  beard: string;
  clothes: string;
  outfit: string;
  face: string;
};
export type Animal = { kind: "animal"; animal: string; backdrop: string };
export type Look = Person | Animal;

export const DEFAULT_PERSON: Person = {
  kind: "person",
  skin: SKINS[3],
  top: "shortRound",
  hair: HAIRS[0],
  cover: COLORS[2],
  glasses: "none",
  beard: "none",
  clothes: COLORS[3],
  outfit: OUTFITS[0],
  face: "smile",
};
export const DEFAULT_ANIMAL: Animal = { kind: "animal", animal: "cat", backdrop: BACKDROPS[2] };

const one = (o: Record<string, unknown>, k: string, list: string[], fallback?: string) => {
  const v = o[k] ?? fallback;
  return typeof v === "string" && list.includes(v) ? v : null;
};

/** Every field must be one of the lists above; anything else (including injected SVG) is refused. */
export function parseLook(v: unknown): Look | null {
  const o = v as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  if (o.kind === "animal") {
    const animal = one(o, "animal", ANIMALS);
    const backdrop = one(o, "backdrop", BACKDROPS);
    return animal && backdrop ? { kind: "animal", animal, backdrop } : null;
  }
  if (o.kind !== undefined && o.kind !== "person") return null;
  const p: Partial<Person> = { kind: "person" };
  const fields: [keyof Person, string[], string?][] = [
    ["skin", SKINS],
    ["top", TOPS],
    ["hair", HAIRS],
    ["cover", COLORS],
    ["glasses", GLASSES],
    ["beard", BEARDS],
    ["clothes", COLORS],
    // Added after the first version; older saved looks get the defaults.
    ["outfit", OUTFITS, OUTFITS[0]],
    ["face", Object.keys(FACES), "smile"],
  ];
  for (const [k, list, fallback] of fields) {
    const val = one(o, k, list, fallback);
    if (!val) return null;
    (p as Record<string, string>)[k] = val;
  }
  return p as Person;
}

const cache = new Map<string, string>();

/** The avatar as an SVG data URI. ponytail: an in-memory cache per process; there are only so many looks. */
export function lookUri(l: Look) {
  const key = JSON.stringify(l);
  let uri = cache.get(key);
  if (!uri) {
    if (l.kind === "animal") uri = `data:image/svg+xml;utf8,${encodeURIComponent(animalSvg(l.animal))}`;
    else {
      const off = (v: string) => (v === "none" ? { p: 0, v: undefined } : { p: 100, v: [v] });
      const top = off(l.top);
      const glasses = off(l.glasses);
      const beard = off(l.beard);
      const face = FACES[l.face] ?? FACES.smile;
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
        clothing: [l.outfit] as never,
        clothesColor: [l.clothes],
        eyes: [face.eyes] as never,
        eyebrows: [face.eyebrows] as never,
        mouth: [face.mouth] as never,
      }).toDataUri();
    }
    if (cache.size > 500) cache.clear();
    cache.set(key, uri);
  }
  return uri;
}

/** Background CSS for a round avatar box. A person sits a little low so the face fills the circle. */
export function lookStyle(l: Look, soft: string) {
  return l.kind === "animal"
    ? { backgroundColor: `#${l.backdrop}`, backgroundImage: `url("${lookUri(l)}")`, backgroundSize: "100%", backgroundPosition: "center" }
    : { backgroundColor: soft, backgroundImage: `url("${lookUri(l)}")`, backgroundSize: "112%", backgroundPosition: "center 30%" };
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
