// Machine-translates the English UI lines (src/lib/en.ts) into src/lib/locales/<lang>.json.
// Only lines a locale lacks are sent, so re-running after adding keys translates just the new ones.
// Usage: node scripts/i18n-translate.mjs [lang ...]   (Node 23.6+ reads en.ts directly)
// ponytail: Google's free web endpoint, no key. Swap in a paid API (or native reviewers) before launch.
import { readFileSync, writeFileSync } from "node:fs";
import { EN } from "../src/lib/en.ts";

const ALL = ["zh", "vi", "th", "uz", "mn", "fil", "ne", "id", "ja", "km", "kk", "ru", "fr", "hi"];
const API = { zh: "zh-CN", fil: "tl" };
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
// Short labels the engine misreads without context ("Korean" became an adjective, "Pop-ups" became windows).
const HINT = {
  "한국어": "Korean language",
  "팝업·이벤트": "Pop-up stores & events",
  "모두의 광장": "Public square for everyone",
  "새싹 이웃": "Newcomer neighbor",
  "동네 반장": "Neighborhood leader",
  "명예 주민": "Honorary resident",
};
// Labels start with a capital where the English one does ("корейский" -> "Корейский").
const cap = (en, v) => (/^[\p{Lu}{]/u.test(en) ? v.charAt(0).toLocaleUpperCase() + v.slice(1) : v);

async function gtx(text, to) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${API[to] ?? to}&dt=t`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ q: text }),
    });
    if (r.ok) return (await r.json())[0].map((x) => x[0]).join("");
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
  throw new Error(`translate failed for ${to}`);
}

// "{country} neighbor" -> "{0} neighbor", so the engine leaves placeholders alone.
function protect(s) {
  const names = [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
  return { text: names.reduce((t, n, i) => t.replaceAll(`{${n}}`, `{${i}}`), s), names };
}
function restore(s, names) {
  s = s.replace(/[{｛]\s*(\d+)\s*[}｝]/g, "{$1}");
  if (!names.every((_, i) => s.includes(`{${i}}`))) return null;
  return names.reduce((t, n, i) => t.replaceAll(`{${i}}`, `{${n}}`), s).trim();
}

for (const lang of langs) {
  const file = `src/lib/locales/${lang}.json`;
  const old = JSON.parse(readFileSync(file, "utf8"));
  const todo = Object.keys(EN).filter((k) => !old[k]);
  const got = {};
  // One request per batch of lines; fall back to one line per request if the engine merges lines.
  for (let i = 0; i < todo.length; ) {
    const batch = [];
    let size = 0;
    while (i < todo.length && batch.length < 50 && size < 3000) {
      batch.push(todo[i]);
      size += EN[todo[i++]].length + 1;
    }
    const src = batch.map((k) => protect(HINT[k] ?? EN[k]));
    let out = (await gtx(src.map((p) => p.text.replaceAll("\n", " ")).join("\n"), lang)).split("\n");
    if (out.length !== batch.length) out = await Promise.all(src.map((p) => gtx(p.text, lang)));
    batch.forEach((k, j) => {
      const v = restore(out[j] ?? "", src[j].names);
      if (v) got[k] = v;
      else console.warn(`${lang}: kept English for ${JSON.stringify(k)}`);
    });
    save(); // after every batch, so a rate limit midway keeps what was done
  }
  console.log(`${lang}: +${Object.keys(got).length}, ${Object.keys(save()).length}/${Object.keys(EN).length}`);

  // Keep en.ts order; drop lines en.ts no longer has.
  function save() {
    const next = Object.fromEntries(Object.keys(EN).flatMap((k) => (old[k] || got[k] ? [[k, cap(EN[k], old[k] || got[k])]] : [])));
    writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
    return next;
  }
}
