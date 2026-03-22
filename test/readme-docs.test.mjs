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
    "verify --strict",
    "verify --explain single-return",
    "Using verify in CI",
    "Verify Output",
    "`init` step by step",
    "`refactor` step by step",
    "SKILLS.md",
    "skills/init-workflow/SKILL.md",
    "skills/feature-shaping/SKILL.md",
    "skills/http-api-conventions/SKILL.md",
    "skills/refactor-workflow/SKILL.md",
    "PROMPT.md",
    "prompts/refactor.prompt.md",
    "prompts/init-phase-2-implement.md",
    "prompts/refactor-phase-2-rebuild.md",
    "ai/rules.md",
    "SCAFFOLD-FEEDBACK.md",
    ".code-standards/refactor-source/public-contract.json",
    "package-grade README",
    "public exports and public class methods",
  ]) {
    assert.match(readmeRaw, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
