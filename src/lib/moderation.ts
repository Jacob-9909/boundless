// Automatic check for slurs and profanity before a post or comment is saved.
// No imports: scripts/moderation-check.mjs runs this file directly with Node.
// ponytail: a fixed word list catches the obvious cases only; reports and the moderation queue handle the rest.
// Swap in a classifier model if spelled-out evasions ("ㅆ1ㅂ") become common.

// Korean, Chinese and Japanese terms are matched inside words, after spaces, digits and symbols are removed
// ("씨 발", "씨1발", "시.발" all match). Words that only look like a slur are removed first.
const SAFE = ["시발점", "시발역", "시발택시"];
const CJK = [
  // Profanity
  "씨발", "시발", "씨빨", "ㅅㅂ", "ㅆㅂ", "병신", "ㅂㅅ", "븅신", "개새끼", "개색기", "좆", "존나", "지랄", "니미", "느금", "엠창",
  // Slurs about nationality, race or origin (the community is for everyone in Korea)
  "짱깨", "짱개", "쪽바리", "똥남아", "깜둥", "흑형", "외노자", "조선족새끼",
  // Chinese and Japanese
  "傻逼", "操你", "肏", "支那", "死ね",
];
// Latin and Cyrillic terms only match as whole words, so "Scunthorpe" or "assassin" pass.
const WORDS =
  /(?:^|[^\p{L}])(fuck\p{L}*|motherfuck\p{L}*|shit|bullshit|bitch\p{L}*|cunt|nigg(?:er|a)s?|fag(?:got)?s?|retard(?:ed)?|chinks?|gooks?|whores?|địt|đụ|lồn|cặc|сук[аи]|бля\p{L}*|хуй\p{L}*|пизд\p{L}*)(?=$|[^\p{L}])/iu;

/** True when the text contains a word on the list. */
export function isAbusive(text: string) {
  const s = text.normalize("NFC").toLowerCase();
  if (WORDS.test(s)) return true;
  let squeezed = s.replace(/[\s\d\p{P}\p{S}]+/gu, "");
  for (const w of SAFE) squeezed = squeezed.replaceAll(w, "");
  return CJK.some((w) => squeezed.includes(w));
}
