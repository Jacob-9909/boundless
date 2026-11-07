// Fails when a Korean UI key used in src/ has no English line in src/lib/en.ts.
// Usage: node scripts/i18n-check.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|mjs)$/.test(f) && !p.endsWith("en.ts")) files.push(p);
  }
})("src");

const hangul = /[가-힣]/;
const used = new Set();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  // t("..."), tr(lang, "..."), { ko: "..." }, and Korean error strings returned from actions
  for (const re of [/\bt\(\s*"([^"]+)"/g, /\btr\(\s*\w+\s*,\s*"([^"]+)"/g, /\bid:\s*"[^"]+",\s*ko:\s*"([^"]+)"/g, /(?:error|fail)\(?\s*[:=]?\s*"([^"]+)"/g, /\bdesc:\s*"([^"]+)"/g, /\b(?:titleHint|bodyHint):\s*"([^"]+)"/g, /\bmin:\s*\d+,\s*ko:\s*"([^"]+)"/g]) {
    for (const m of src.matchAll(re)) if (hangul.test(m[1])) used.add(m[1]);
  }
}

const en = readFileSync("src/lib/en.ts", "utf8");
const keys = new Set([...en.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]));
const missing = [...used].filter((k) => !keys.has(k));
const unused = [...keys].filter((k) => !used.has(k));
if (unused.length) console.log(`unused (${unused.length}):\n` + unused.map((k) => `  ${JSON.stringify(k)}`).join("\n"));
if (missing.length) {
  console.log(`missing (${missing.length}):\n` + missing.map((k) => `  ${JSON.stringify(k)}: "",`).join("\n"));
  process.exit(1);
}
console.log(`i18n ok: ${used.size} keys`);
