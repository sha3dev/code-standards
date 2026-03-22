import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ensureBiomeIgnore } from "../lib/project/biome-ignore.mjs";

test("ensureBiomeIgnore includes managed files in the default ignore set", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-biome-ignore-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await ensureBiomeIgnore(targetDir, ["AGENTS.md", "ai/contract.json", "prompts/init.prompt.md"]);

  const biomeIgnoreRaw = await readFile(path.join(targetDir, ".biomeignore"), "utf8");

  assert.match(biomeIgnoreRaw, /^\.code-standards$/m);
  assert.match(biomeIgnoreRaw, /^AGENTS\.md$/m);
  assert.match(biomeIgnoreRaw, /^ai\/contract\.json$/m);
  assert.match(biomeIgnoreRaw, /^prompts\/init\.prompt\.md$/m);
});
