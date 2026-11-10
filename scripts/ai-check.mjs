// Checks the parts of the AI helpers that must hold whatever the AI says: personal details are found and
// removed, and summaries keep only real answer numbers and contacts that appear in the thread.
// Usage: node scripts/ai-check.mjs (Node 23.6+ reads .ts directly)
import assert from "node:assert/strict";
import { findPII, stripPII } from "../src/lib/pii.ts";
import { parseCheck, parseSummary, threadText } from "../src/lib/ai.ts";

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
    steps: ["Call 1350", ""],
    documents: ["pay slip"],
    contacts: ["1350 (Ministry of Labor)", "www.moel.go.kr", "02-9999-9999 (invented)", "the labor office"],
    sources: [1, 1, 2, 7, 0, "2"],
  },
  thread,
  2
);
assert.deepEqual(s.steps, ["Call 1350"]);
assert.deepEqual(s.contacts, ["1350 (Ministry of Labor)", "www.moel.go.kr"], "invented numbers and contacts without a number are dropped");
assert.deepEqual(s.sources, [1, 2]);
assert.equal(parseSummary({ situation: "x", steps: [] }, thread, 2), null);
assert.equal(parseSummary(null, thread, 2), null);

const c = parseCheck({ board: "visa", title: "  Clearer title ", missing: ["visa type?", "", "region?", "a", "b"], privacy: [] }, ["visa", "work"], "work");
assert.deepEqual(c, { board: "visa", title: "Clearer title", missing: ["visa type?", "region?", "a"], privacy: [] });
assert.equal(parseCheck({ board: "nope", title: "" , missing: [], privacy: [] }, ["visa"], "work").board, null);
assert.equal(parseCheck({ board: "work", title: "", missing: [], privacy: [] }, ["work"], "work").board, null, "same board is not a suggestion");

console.log("ai ok");
