// The avatar is stored as chosen parts; this checks that only listed parts get through (the server trusts
// nothing from the builder) and that photo colors map to the nearest palette color.
// Usage: node scripts/avatar-check.mjs (Node 23.6+ reads .ts directly)
import assert from "node:assert/strict";
import { BEARDS, COVERS, DEFAULT_LOOK, GLASSES, HAIRS, lookUri, nearest, parseLook, SKINS, TOPS } from "../src/lib/avatar.ts";

assert.deepEqual(parseLook(DEFAULT_LOOK), DEFAULT_LOOK);
assert.equal(parseLook({ ...DEFAULT_LOOK, skin: '"/><script>alert(1)</script>' }), null, "anything off the list is refused");
assert.equal(parseLook({ ...DEFAULT_LOOK, top: "eyepatch" }), null);
assert.equal(parseLook({ ...DEFAULT_LOOK, clothes: undefined }), null);
assert.equal(parseLook("hijab"), null);
assert.ok(COVERS.includes("hijab") && TOPS.includes("hijab"), "hijab stays on offer");

// Every part renders.
for (const top of TOPS) assert.match(lookUri({ ...DEFAULT_LOOK, top }), /^data:image\/svg\+xml/);
for (const glasses of GLASSES) lookUri({ ...DEFAULT_LOOK, glasses });
for (const beard of BEARDS) lookUri({ ...DEFAULT_LOOK, beard });

assert.equal(nearest([250, 220, 185], SKINS), "ffdbb4");
assert.equal(nearest([95, 65, 52], SKINS), "614335");
assert.equal(nearest([30, 25, 22], HAIRS), "2c1b18");
assert.equal(nearest([215, 180, 115], HAIRS), "d6b370");

console.log("avatar ok");
