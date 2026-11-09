// Self-check for the automatic word filter. Usage: node scripts/moderation-check.mjs
import assert from "node:assert/strict";
import { isAbusive } from "../src/lib/moderation.ts";

for (const bad of ["씨발 진짜", "씨 1 발", "이 병신아", "짱깨들", "fuck this", "You BITCH", "đụ má", "сука", "блять", "motherfucker"]) assert.ok(isAbusive(bad), bad);
for (const ok of ["시발점이 어디예요?", "Scunthorpe", "assassin's creed", "shitake mushrooms", "외국인등록증 발급", "Đi đâu?", "суккуленты", "미친 맛집", "감자 튀기기", "애비뉴 호텔"])
  assert.ok(!isAbusive(ok), ok);
console.log("moderation ok");
