// NVIDIA NIM (OpenAI compatible) for the two AI helpers: the summary of a solved thread and the draft check.
// The AI never answers for a neighbor; it only tidies what neighbors wrote and helps people ask better.
// Both calls ask for a JSON schema. Anything off-shape becomes null and the helper simply does not show.
// The AI is not trusted: lengths, answer numbers and contacts are checked here. No imports, so
// scripts/ai-check.mjs can test the parsers directly. Callers strip personal details first (pii.ts).

const URL_CHAT = "https://integrate.api.nvidia.com/v1/chat/completions";
// Same model as triplan: with thinking off it answered in 0-4 s and accurately (2026-11-07 comparison).
// With thinking on it spends max_tokens on reasoning and the answer comes back empty.
const MODEL = "nvidia/nemotron-3.5-super-vl-120b-a12b";

export const aiEnabled = () => Boolean(process.env.NVIDIA_API_KEY);

async function nimJson(o: { name: string; system: string; user: string; schema: object; maxTokens: number }): Promise<unknown> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(URL_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: o.maxTokens,
        messages: [
          { role: "system", content: o.system },
          { role: "user", content: o.user },
        ],
        response_format: { type: "json_schema", json_schema: { name: o.name, schema: o.schema } },
        chat_template_kwargs: { enable_thinking: false },
      }),
      // The free endpoint swings between 1 and 25 s; the screens show a waiting state meanwhile.
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const content = (await res.json())?.choices?.[0]?.message?.content;
    return typeof content === "string" ? JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) : null;
  } catch {
    return null;
  }
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const list = (v: unknown, max: number, n: number) => (Array.isArray(v) ? v.map((x) => clip(x, n)).filter(Boolean).slice(0, max) : []);
const strings = { type: "array", items: { type: "string" } };

/* ---------- summary of a solved thread ---------- */

export type Summary = { situation: string; steps: string[]; documents: string[]; contacts: string[]; sources: number[] };
/** Part of the cache key: bump it when the prompt or parser changes so old summaries are made again. */
export const SUMMARY_VERSION = 2;
export type ThreadLine = { text: string; helpful: number; author: boolean };

export function threadText(post: { title: string; body: string }, lines: ThreadLine[]) {
  const answers = lines.map((l, i) => `[${i + 1}] ${l.author ? "asker" : "neighbor"}${l.helpful ? ` (${l.helpful} found it helpful)` : ""}: ${l.text}`);
  return `QUESTION: ${post.title}\n${post.body}\n\nANSWERS:\n${answers.join("\n")}`;
}

/**
 * Every step must name the answer it comes from, and steps without a real answer number are dropped, so a
 * thread whose answers never say how it was solved gets no card (the model otherwise fills in generic advice).
 * Contacts survive only when their numbers and web addresses appear in the thread.
 */
export function parseSummary(raw: unknown, thread: string, answers: number): Summary | null {
  const o = raw as Record<string, unknown> | null;
  const situation = clip(o?.situation, 240);
  const cited = (Array.isArray(o?.steps) ? o.steps : [])
    .map((s: { text?: unknown; answer?: unknown }) => ({ text: clip(s?.text, 200), answer: s?.answer }))
    .filter((s): s is { text: string; answer: number } => Boolean(s.text) && Number.isInteger(s.answer) && (s.answer as number) >= 1 && (s.answer as number) <= answers)
    .slice(0, 4);
  if (!situation || !cited.length) return null;
  const steps = cited.map((s) => s.text);
  const digits = thread.replace(/[\s-]/g, "");
  const lower = thread.toLowerCase();
  const contacts = list(o?.contacts, 4, 120).filter((c) => {
    const nums = (c.match(/\d[\d\s-]{2,}\d/g) ?? []).map((n) => n.replace(/[\s-]/g, ""));
    const hosts = c.toLowerCase().match(/[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [];
    return nums.length + hosts.length > 0 && nums.every((n) => digits.includes(n)) && hosts.every((h) => lower.includes(h));
  });
  return { situation, steps, documents: list(o?.documents, 5, 80), contacts, sources: [...new Set(cited.map((s) => s.answer))] };
}

export async function summarizeThread(post: { title: string; body: string }, lines: ThreadLine[], language: string) {
  const thread = threadText(post, lines);
  const raw = await nimJson({
    name: "solved_summary",
    system:
      "You summarize solved questions from an online community of foreigners living in Korea. " +
      "Use only facts stated in the thread. Never add advice, phone numbers, places or rules that are not in it. Reply with JSON only.",
    user:
      `Write every text field in ${language}. Summarize how the asker's problem was solved, so a newcomer with the same problem knows what to do next.\n` +
      "situation: the asker's problem in one sentence.\n" +
      "steps: up to 4 steps that solved it, in order. Each step must be said in one of the numbered answers; give that answer's number. " +
      "If no answer explains what to do, return an empty list. Do not use general knowledge.\n" +
      "documents: papers or items the answers say are needed (empty if none).\n" +
      `contacts: phone numbers or websites written in the answers (empty if none).\n\n${thread}`,
    schema: {
      type: "object",
      properties: {
        situation: { type: "string" },
        steps: { type: "array", items: { type: "object", properties: { text: { type: "string" }, answer: { type: "integer" } }, required: ["text", "answer"] } },
        documents: strings,
        contacts: strings,
      },
      required: ["situation", "steps", "documents", "contacts"],
    },
    maxTokens: 700,
  });
  return raw ? parseSummary(raw, thread, lines.length) : null;
}

/* ---------- check a draft before posting ---------- */

export type DraftCheck = { board: string | null; title: string | null; missing: string[]; privacy: string[] };

export function parseCheck(raw: unknown, boards: string[], current: string): DraftCheck | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  const board = typeof o.board === "string" && boards.includes(o.board) && o.board !== current ? o.board : null;
  return { board, title: clip(o.title, 120) || null, missing: list(o.missing, 3, 160), privacy: list(o.privacy, 3, 160) };
}

/** `boards` is empty for a country lounge, where the board cannot change. */
export async function checkDraft(d: { title: string; body: string; board: string }, boards: { id: string; about: string }[], language: string) {
  const raw = await nimJson({
    name: "draft_check",
    system:
      "You help foreigners living in Korea write a post for a community board so that neighbors can answer it well. " +
      "You do not answer the question. Reply with JSON only.",
    user:
      (boards.length
        ? `board: the best board id for this post from the list below (now "${d.board}").\n${boards.map((b) => `${b.id}: ${b.about}`).join("\n")}\n`
        : 'board: always "".\n') +
      'title: a clearer title written in the language of DRAFT TEXT (never another language), under 60 characters, or "" if the title is already clear.\n' +
      `missing: up to 3 short suggestions in ${language} for details neighbors would need to answer (visa type, region, dates, budget...) that the draft lacks; empty if nothing important is missing.\n` +
      `privacy: up to 3 short warnings in ${language} if the draft reveals a real name, an exact home address, or a photo of a face or ID card; empty otherwise.\n\n` +
      `DRAFT TITLE: ${d.title}\nDRAFT TEXT:\n${d.body}`,
    schema: {
      type: "object",
      properties: { board: { type: "string" }, title: { type: "string" }, missing: strings, privacy: strings },
      required: ["board", "title", "missing", "privacy"],
    },
    maxTokens: 500,
  });
  return raw ? parseCheck(raw, boards.map((b) => b.id), d.board) : null;
}

/* ---------- classify a post when it is filed ---------- */

// Ids match ALERTS in src/lib/guide.ts (scripts/ai-check.mjs checks). Each line is what the model reads.
const ALERT_TEXT: Record<string, string> = {
  self_harm: "the writer is thinking about suicide or hurting themselves",
  abuse: "domestic violence or sexual violence against the writer",
  confined: "the employer keeps the writer's passport, locks them in, or forces them to work",
  violence: "the writer was assaulted or is being threatened",
  medical: "a medical emergency happening now",
  wage: "the writer is not being paid wages, or was injured at work",
  scam: "the writer is being scammed or lost money (rent deposit, job, marketplace)",
};

export type Classified = { visa: string | null; region: string | null; alert: string | null };

/** Visa codes like E-9, D-2, F-2-7 (E9 and e-9 become E-9); anything else is dropped. */
export function normalizeVisa(v: unknown) {
  const m = typeof v === "string" ? v.trim().toUpperCase().match(/^([A-H])-?(\d{1,2})(-\d{1,2})?$/) : null;
  return m ? `${m[1]}-${m[2]}${m[3] ?? ""}` : null;
}

export function parseClassify(raw: unknown, regions: string[]): Classified | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  const pick = (v: unknown, ids: string[]) => (typeof v === "string" && ids.includes(v) ? v : null);
  return { visa: normalizeVisa(o.visa), region: pick(o.region, regions), alert: pick(o.alert, Object.keys(ALERT_TEXT)) };
}

// When the AI is off or fails, plain words of suicide still bring up the crisis card. A false alarm only shows
// the author a helpline, so this leans toward catching. ponytail: a handful of languages; add more as they show up.
const SELF_HARM = /자살|죽고\s*싶|살기\s*싫|suicid|kill myself|end my life|want to die|tự tử|muốn chết|自杀|想死|死にたい|自殺|суицид|покончить с собой|хочу умереть/i;
export const crisisFallback = (text: string) => (SELF_HARM.test(text) ? "self_harm" : null);

export async function classifyPost(d: { title: string; body: string }, regions: { id: string; name: string }[]) {
  const raw = await nimJson({
    name: "post_class",
    system: "You read posts from a community of foreigners living in Korea and label them. You never reply to the writer. Reply with JSON only.",
    user:
      'visa: the visa the writer says they hold, as its code (E-9, D-2, F-6, H-2...), only if stated; "" otherwise.\n' +
      `region: one id if the post is clearly about a place in that region, else "".\n${regions.map((r) => `${r.id}: ${r.name}`).join("\n")}\n` +
      'alert: one id if the writer or someone they describe is in this situation now, else "". A general question about rules is not an alert.\n' +
      `${Object.entries(ALERT_TEXT).map(([id, text]) => `${id}: ${text}`).join("\n")}\n\n` +
      `TITLE: ${d.title}\nTEXT:\n${d.body}`,
    schema: {
      type: "object",
      properties: { visa: { type: "string" }, region: { type: "string" }, alert: { type: "string" } },
      required: ["visa", "region", "alert"],
    },
    maxTokens: 120,
  });
  return raw ? parseClassify(raw, regions.map((r) => r.id)) : null;
}
