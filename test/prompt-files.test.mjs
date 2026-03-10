import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { collectPromptFiles, renderPromptFiles } from "../lib/project/prompt-files.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, "..");

test("collectPromptFiles returns the managed prompt set", async () => {
  const promptFiles = await collectPromptFiles(packageRoot);

  assert.deepEqual(promptFiles, [
    "PROMPT.md",
    "prompts/init-contract.md",
    "prompts/init.prompt.md",
    "prompts/refactor-contract.md",
    "prompts/refactor.prompt.md",
  ]);
});

test("renderPromptFiles materializes prompts into the target repo", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-prompt-files-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await renderPromptFiles(packageRoot, targetDir, { projectName: "demo-project", packageName: "@scope/demo", packageVersion: "0.9.0", year: "2026" });

  const generatedRefactorPrompt = await readFile(path.join(targetDir, "prompts", "refactor.prompt.md"), "utf8");
  const sourceRefactorPrompt = await readFile(path.join(packageRoot, "prompts", "refactor.prompt.md"), "utf8");
  const rootPrompt = await readFile(path.join(targetDir, "PROMPT.md"), "utf8");

  assert.equal(generatedRefactorPrompt, sourceRefactorPrompt);
  assert.match(rootPrompt, /AGENTS\.md/);
  assert.match(rootPrompt, /ai\/contract\.json/);
  assert.match(rootPrompt, /prompts\/init-contract\.md/);
  assert.match(rootPrompt, /## Implementation Request/);
  assert.match(rootPrompt, /Complete this section before sending the prompt to your LLM/);
});

test("contract prompts require the LLM to execute npm run check itself", async () => {
  for (const promptPath of ["prompts/init-contract.md", "prompts/refactor-contract.md"]) {
    const promptRaw = await readFile(path.join(packageRoot, promptPath), "utf8");

    assert.match(promptRaw, /execute `npm run check` yourself before finishing/);
    assert.match(promptRaw, /fix the issues and rerun it until it passes/);
  }
});

test("refactor contract forbids restoring managed files from the snapshot", async () => {
  const promptRaw = await readFile(path.join(packageRoot, "prompts", "refactor-contract.md"), "utf8");

  assert.match(
    promptRaw,
    /you MUST NEVER restore `AGENTS\.md`, `ai\/\*`, `prompts\/\*`, `\.vscode\/\*`, `biome\.json`, `tsconfig\*\.json`, `package\.json`, or lockfiles from that snapshot/i,
  );
  assert.match(promptRaw, /pre-existing managed-file drift created by the scaffold regeneration is expected and is NOT a blocker/i);
  assert.match(promptRaw, /you MUST NEVER use `git checkout`, `git restore`, or snapshot copies to roll managed files back/i);
  assert.match(promptRaw, /You MUST analyze the legacy code first/);
  assert.match(promptRaw, /You MUST then build a fresh implementation on top of the regenerated scaffold/);
  assert.match(promptRaw, /copying legacy files into the new scaffold and making only superficial edits/);
  assert.match(promptRaw, /preserving plural feature folders, unnecessary typed errors, helper files, wrapper services/);
  assert.match(promptRaw, /before writing final code, you MUST explicitly compare the planned target structure against the active standards/i);
});

test("short prompts delegate to the contract files", async () => {
  const initPromptRaw = await readFile(path.join(packageRoot, "prompts", "init.prompt.md"), "utf8");
  const refactorPromptRaw = await readFile(path.join(packageRoot, "prompts", "refactor.prompt.md"), "utf8");

  assert.match(initPromptRaw, /prompts\/init-contract\.md/);
  assert.match(refactorPromptRaw, /prompts\/refactor-contract\.md/);
});
