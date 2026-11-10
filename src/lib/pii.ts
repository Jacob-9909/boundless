// Personal details people paste into a post by mistake. The write form warns as they type, and the server
// removes them before any text goes to the AI API. No imports: scripts/ai-check.mjs tests this file directly.
// ponytail: Korean formats only; add others if reports show them.
const RULES = [
  { name: "외국인등록번호", re: /\b\d{6}\s?-\s?[1-8]\d{6}\b/g },
  { name: "전화번호", re: /(?:\+82[\s-]?|\b0)1[016789][\s.-]?\d{3,4}[\s.-]?\d{4}\b/g },
  { name: "이메일", re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  { name: "여권번호", re: /\b[A-Z]{1,2}\d{7,8}\b/g },
];

/** Which kinds of personal detail the text shows (Korean dictionary keys). */
export const findPII = (text: string) => RULES.filter((r) => text.match(r.re)).map((r) => r.name);

export const stripPII = (text: string) => RULES.reduce((s, r) => s.replace(r.re, "[removed]"), text);
