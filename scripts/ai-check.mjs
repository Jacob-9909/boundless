// Checks the parts of the AI helpers that must hold whatever the AI says: personal details are found and
// removed, and summaries keep only real answer numbers and contacts that appear in the thread.
// Usage: node scripts/ai-check.mjs (Node 23.6+ reads .ts directly)
import assert from "node:assert/strict";
import { findPII, stripPII } from "../src/lib/pii.ts";
import { crisisFallback, normalizeVisa, parseCheck, parseClassify, parseSummary, threadText } from "../src/lib/ai.ts";
import { ALERTS, hotline } from "../src/lib/guide.ts";

assert.deepEqual(findPII("call me 010-1234-5678"), ["전화번호"]);
assert.deepEqual(findPII("+82 10 1234 5678 or me@example.com"), ["전화번호", "이메일"]);
assert.deepEqual(findPII("card 900101-5123456, passport M12345678"), ["외국인등록번호", "여권번호"]);
assert.deepEqual(findPII("Call 1345 or 1350, open 9-18, costs 30000 won"), [], "hotlines and prices are not personal");
assert.equal(stripPII("text 01012345678 please"), "text [removed] please");

const thread = threadText({ title: "Wage not paid", body: "My boss did not pay March." }, [
  { text: "Call 1350, they helped me. Also see www.moel.go.kr", helpful: 3, author: false },
  { text: "Thanks, it worked!", helpful: 0, author: true },
]);
const s = parseSummary(
  {
    situation: "Unpaid wages",
    steps: [{ text: "Call 1350", answer: 1 }, { text: "", answer: 1 }, { text: "Use general knowledge", answer: 7 }, { text: "No number" }],
    documents: ["pay slip"],
    contacts: ["1350 (Ministry of Labor)", "www.moel.go.kr", "02-9999-9999 (invented)", "the labor office"],
  },
  thread,
  2
);
assert.deepEqual(s.steps, ["Call 1350"]);
assert.deepEqual(s.contacts, ["1350 (Ministry of Labor)", "www.moel.go.kr"], "invented numbers and contacts without a number are dropped");
assert.deepEqual(s.sources, [1], "sources are the answers the kept steps cite");
assert.equal(parseSummary({ situation: "x", steps: [] }, thread, 2), null);
assert.equal(parseSummary({ situation: "x", steps: [{ text: "Generic advice", answer: 0 }] }, thread, 2), null, "no cited step, no card");
assert.equal(parseSummary(null, thread, 2), null);

const c = parseCheck({ board: "visa", title: "  Clearer title ", missing: ["visa type?", "", "region?", "a", "b"], privacy: [] }, ["visa", "work"], "work");
assert.deepEqual(c, { board: "visa", title: "Clearer title", missing: ["visa type?", "region?", "a"], privacy: [] });
assert.equal(parseCheck({ board: "nope", title: "" , missing: [], privacy: [] }, ["visa"], "work").board, null);
assert.equal(parseCheck({ board: "work", title: "", missing: [], privacy: [] }, ["work"], "work").board, null, "same board is not a suggestion");

// Labels when a post is filed
assert.equal(normalizeVisa("e9"), "E-9");
assert.equal(normalizeVisa(" F-2-7 "), "F-2-7");
assert.equal(normalizeVisa("tourist"), null);
assert.equal(normalizeVisa("Z-1"), null);
assert.deepEqual(parseClassify({ visa: "d2", region: "busan", alert: "wage" }, ["seoul", "busan"]), { visa: "D-2", region: "busan", alert: "wage" });
assert.deepEqual(parseClassify({ visa: "", region: "mars", alert: "panic" }, ["seoul"]), { visa: null, region: null, alert: null });
assert.equal(crisisFallback("요즘 너무 힘들어서 죽고 싶어요"), "self_harm");
assert.equal(crisisFallback("Tôi muốn chết"), "self_harm");
assert.equal(crisisFallback("Where do I renew my ARC?"), null);
// Every alert the AI may return has a card with real numbers.
const ids = ALERTS.map((a) => a.id).sort();
assert.deepEqual(Object.keys(parseClassify({ alert: "x" }, []) ?? {}).length, 3);
for (const id of ids) assert.equal(parseClassify({ visa: "", region: "", alert: id }, []).alert, id, `ai.ts knows alert ${id}`);
for (const a of ALERTS) for (const tel of a.tels) assert.ok(hotline(tel), `${a.id}: ${tel} is in HOTLINES`);

console.log("ai ok");
