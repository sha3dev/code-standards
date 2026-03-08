import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");

test("README documents verify options and usage", async () => {
  const readmeRaw = await readFile(path.join(repoRoot, "README.md"), "utf8");

  for (const snippet of [
    "verify --report json",
    "verify --only",
    "verify --files",
    "verify --explain single-return",
    "Using verify in CI",
    "Verify Output",
    "`init` step by step",
    "`refactor` step by step",
    "prompts/init.prompt.md",
    "prompts/refactor.prompt.md",
    ".code-standards/refactor-source/public-contract.json",
    "package-grade README",
    "public exports and public class methods",
  ]) {
    assert.match(readmeRaw, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
