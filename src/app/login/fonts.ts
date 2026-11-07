// Display faces for each culture's welcome line. preload: false, so a face downloads only
// when its culture is on screen; CJK faces arrive in small unicode-range slices.
import {
  Be_Vietnam_Pro,
  Bungee,
  Chonburi,
  Fraunces,
  Ma_Shan_Zheng,
  Moul,
  Overpass,
  Philosopher,
  Playfair_Display,
  Rozha_One,
  Rubik,
  Ruslan_Display,
  Shippori_Mincho,
  Yatra_One,
} from "next/font/google";

const cn = Ma_Shan_Zheng({ weight: "400", subsets: ["latin"], variable: "--font-cn", preload: false });
const jp = Shippori_Mincho({ weight: "800", subsets: ["latin"], variable: "--font-jp", preload: false });
const vn = Be_Vietnam_Pro({ weight: "800", subsets: ["vietnamese"], variable: "--font-vn", preload: false });
const th = Chonburi({ weight: "400", subsets: ["thai"], variable: "--font-th", preload: false });
const uz = Philosopher({ weight: "700", subsets: ["latin"], variable: "--font-uz", preload: false });
const mn = Rubik({ weight: "800", subsets: ["cyrillic"], variable: "--font-mn", preload: false });
const kz = Rubik({ weight: "700", subsets: ["cyrillic-ext"], variable: "--font-kz", preload: false });
const ph = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-ph", preload: false });
const np = Yatra_One({ weight: "400", subsets: ["devanagari"], variable: "--font-np", preload: false });
const id = Fraunces({ weight: "800", subsets: ["latin"], variable: "--font-id", preload: false });
const kh = Moul({ weight: "400", subsets: ["khmer"], variable: "--font-kh", preload: false });
const ru = Ruslan_Display({ weight: "400", subsets: ["cyrillic"], variable: "--font-ru", preload: false });
const fr = Playfair_Display({ weight: "800", style: "italic", subsets: ["latin"], variable: "--font-fr", preload: false });
const us = Overpass({ weight: "900", subsets: ["latin"], variable: "--font-us", preload: false });
const ind = Rozha_One({ weight: "400", subsets: ["devanagari"], variable: "--font-in", preload: false });

export const cultureFonts = [cn, jp, vn, th, uz, mn, kz, ph, np, id, kh, ru, fr, us, ind].map((f) => f.variable).join(" ");
