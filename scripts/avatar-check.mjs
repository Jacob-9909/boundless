// The avatar is stored as chosen parts; this checks that only listed parts get through (the server trusts
// nothing from the builder), that every part renders, and that photo colors map to the nearest palette color.
// Usage: node scripts/avatar-check.mjs (Node 23.6+ reads .ts directly)
import assert from "node:assert/strict";
import {
  ANIMALS,
  BACKDROPS,
  BEARDS,
  COVERS,
  DEFAULT_ANIMAL,
  DEFAULT_PERSON,
  FACES,
  GLASSES,
  HAIRS,
  lookUri,
  nearest,
  OUTFITS,
  parseLook,
  SKINS,
  TOPS,
} from "../src/lib/avatar.ts";

assert.deepEqual(parseLook(DEFAULT_PERSON), DEFAULT_PERSON);
assert.deepEqual(parseLook(DEFAULT_ANIMAL), DEFAULT_ANIMAL);
assert.equal(parseLook({ ...DEFAULT_PERSON, skin: '"/><script>alert(1)</script>' }), null, "anything off the list is refused");
assert.equal(parseLook({ ...DEFAULT_PERSON, top: "eyepatch" }), null);
assert.equal(parseLook({ ...DEFAULT_PERSON, clothes: undefined }), null);
assert.equal(parseLook({ ...DEFAULT_PERSON, kind: "robot" }), null);
assert.equal(parseLook({ kind: "animal", animal: "dragon", backdrop: BACKDROPS[0] }), null);
assert.equal(parseLook({ kind: "animal", animal: "cat", backdrop: "ff0000" }), null);
assert.equal(parseLook("hijab"), null);
// A look saved before outfits and faces existed still loads, with the defaults.
const { kind, outfit, face, ...older } = DEFAULT_PERSON;
assert.deepEqual(parseLook(older), { ...older, kind, outfit, face });
assert.ok(COVERS.includes("hijab") && TOPS.includes("hijab"), "hijab stays on offer");
assert.ok(SKINS.length >= 10 && HAIRS.length >= 12 && ANIMALS.length >= 12, "a wide range of looks");

// Every part renders.
const svg = /^data:image\/svg\+xml/;
for (const top of TOPS) assert.match(lookUri({ ...DEFAULT_PERSON, top }), svg);
for (const glasses of GLASSES) lookUri({ ...DEFAULT_PERSON, glasses });
for (const beard of BEARDS) lookUri({ ...DEFAULT_PERSON, beard });
for (const outfit of OUTFITS) lookUri({ ...DEFAULT_PERSON, outfit });
for (const face of Object.keys(FACES)) lookUri({ ...DEFAULT_PERSON, face });
for (const animal of ANIMALS) assert.ok(decodeURIComponent(lookUri({ ...DEFAULT_ANIMAL, animal })).includes("<circle"), `${animal} draws`);

assert.equal(nearest([253, 231, 214], SKINS), "fde7d6");
assert.equal(nearest([78, 46, 33], SKINS), "4a2b1f");
assert.equal(nearest([28, 22, 22], HAIRS), "1a1414");
assert.equal(nearest([226, 192, 125], HAIRS), "e2c27c");

console.log("avatar ok");
