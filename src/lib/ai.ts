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
export type ThreadLine = { text: string; helpful: number; author: boolean };

export function threadText(post: { title: string; body: string }, lines: ThreadLine[]) {
  const answers = lines.map((l, i) => `[${i + 1}] ${l.author ? "asker" : "neighbor"}${l.helpful ? ` (${l.helpful} found it helpful)` : ""}: ${l.text}`);
  return `QUESTION: ${post.title}\n${post.body}\n\nANSWERS:\n${answers.join("\n")}`;
}

/** Contacts survive only when their numbers and web addresses appear in the thread: the AI must not invent a phone number. */
export function parseSummary(raw: unknown, thread: string, answers: number): Summary | null {
  const o = raw as Record<string, unknown> | null;
  const situation = clip(o?.situation, 240);
  const steps = list(o?.steps, 4, 200);
  if (!situation || !steps.length) return null;
  const digits = thread.replace(/[\s-]/g, "");
  const lower = thread.toLowerCase();
  const contacts = list(o?.contacts, 4, 120).filter((c) => {
    const nums = (c.match(/\d[\d\s-]{2,}\d/g) ?? []).map((n) => n.replace(/[\s-]/g, ""));
    const hosts = c.toLowerCase().match(/[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [];
    return nums.length + hosts.length > 0 && nums.every((n) => digits.includes(n)) && hosts.every((h) => lower.includes(h));
  });
  const nums = Array.isArray(o?.sources) ? o.sources.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= answers) : [];
  return { situation, steps, documents: list(o?.documents, 5, 80), contacts, sources: [...new Set(nums)].slice(0, 5) };
}

export async function summarizeThread(post: { title: string; body: string }, lines: ThreadLine[], language: string) {
  const thread = threadText(post, lines);
  const raw = await nimJson({
    name: "solved_summary",
    system:
      "You summarize solved questions from an online community of foreigners living in Korea. " +
      "Use only facts stated in the thread. Never add advice, phone numbers, places or rules that are not in it. Reply with JSON only.",
    user:
      `Write every field in ${language}. Summarize how the asker's problem was solved, so a newcomer with the same problem knows what to do next.\n` +
      "situation: the asker's problem in one sentence.\n" +
      "steps: 1-4 short steps that solved it, in order.\n" +
      "documents: papers or items those steps need (empty if none).\n" +
      "contacts: phone numbers or websites from the thread that helped (empty if none).\n" +
      `sources: the numbers of the answers you used.\n\n${thread}`,
    schema: {
      type: "object",
      properties: { situation: { type: "string" }, steps: strings, documents: strings, contacts: strings, sources: { type: "array", items: { type: "integer" } } },
      required: ["situation", "steps", "documents", "contacts", "sources"],
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
      "title: a clearer title in the same language as the draft, under 60 characters, or \"\" if the title is already clear.\n" +
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
