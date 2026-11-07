// Community translation through the MyMemory API (free, no key; same approach as triplan).
// Results are cached in boundless.translations so each text is translated once per language.
// ponytail: free tier is ~5k chars/day per IP (50k with MYMEMORY_EMAIL); switch to an LLM provider if quality or volume demands it.
import { q } from "@/lib/db";

const CODES: Record<string, string> = { zh: "zh-CN", fil: "tl", other: "autodetect" };
const api = (lang: string) => CODES[lang] ?? lang;

const utf8 = new TextEncoder();

/** Split into chunks under MyMemory's 500-byte request limit, on paragraph or sentence breaks. */
function chunks(text: string, max = 400) {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    let rest = para;
    while (utf8.encode(rest).length > max) {
      const cut = Math.max(rest.lastIndexOf(". ", max / 2), rest.lastIndexOf("。", max / 3), rest.lastIndexOf(" ", max / 2), Math.floor(max / 3));
      out.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    out.push(rest);
  }
  return out;
}

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function translateText(text: string, from: string, to: string): Promise<string | null> {
  const parts: string[] = [];
  for (const piece of chunks(text)) {
    if (!piece.trim()) {
      parts.push(piece);
      continue;
    }
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", piece);
    url.searchParams.set("langpair", `${api(from)}|${api(to)}`);
    if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      const data = await res.json().catch(() => null);
      const out: unknown = data?.responseData?.translatedText;
      if (!res.ok || data?.quotaFinished || typeof out !== "string") return null;
      parts.push(decode(out));
    } catch {
      return null;
    }
  }
  return parts.join("\n");
}

/** Translate a post (title + body) or a comment (body) into `to`, using the cache when possible. */
export async function translateItem(item: string, src: { title?: string; body: string; lang: string }, to: string) {
  const hit = await q<{ title: string | null; body: string }>("SELECT title, body FROM boundless.translations WHERE item = $1 AND lang = $2", [item, to]);
  if (hit[0]) return hit[0];
  const [title, body] = await Promise.all([src.title ? translateText(src.title, src.lang, to) : Promise.resolve(null), translateText(src.body, src.lang, to)]);
  if (body === null || (src.title && title === null)) return null;
  await q("INSERT INTO boundless.translations (item, lang, title, body) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [item, to, title, body]);
  return { title, body };
}
