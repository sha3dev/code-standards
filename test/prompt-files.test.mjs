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
  assert.match(rootPrompt, /SKILLS\.md/);
  assert.match(rootPrompt, /skills\/init-workflow\/SKILL\.md/);
  assert.match(rootPrompt, /skills\/feature-shaping\/SKILL\.md/);
  assert.match(rootPrompt, /skills\/simplicity-audit\/SKILL\.md/);
  assert.match(rootPrompt, /skills\/change-synchronization\/SKILL\.md/);
  assert.match(rootPrompt, /skills\/test-scope-selection\/SKILL\.md/);
  assert.match(rootPrompt, /skills\/readme-authoring\/SKILL\.md/);
  assert.match(rootPrompt, /skills\/http-api-conventions\/SKILL\.md/);
  assert.match(rootPrompt, /ai\/contract\.json/);
  assert.match(rootPrompt, /prompts\/init-contract\.md/);
  assert.match(rootPrompt, /## Implementation Request/);
  assert.match(rootPrompt, /Complete this section before sending the prompt to your LLM/);
  assert.match(rootPrompt, /execute `npm run check` yourself before finishing/);
  assert.match(rootPrompt, /fix the issues and rerun it until it passes/);
  assert.match(rootPrompt, /without editing managed files unless this is a standards update/);
});

test("contract prompts require the LLM to execute npm run check itself", async () => {
  for (const promptPath of ["prompts/init-contract.md", "prompts/refactor-contract.md"]) {
    const promptRaw = await readFile(path.join(packageRoot, promptPath), "utf8");

    assert.match(promptRaw, /execute `npm run check` yourself before finishing/);
    assert.match(promptRaw, /fix the issues and rerun it until it passes/);
  }
});

test("refactor contract delegates the procedural workflow to the refactor skill", async () => {
  const promptRaw = await readFile(path.join(packageRoot, "prompts", "refactor-contract.md"), "utf8");

  assert.match(promptRaw, /skills\/refactor-workflow\/SKILL\.md/);
  assert.doesNotMatch(promptRaw, /copying legacy files into the new scaffold and making only superficial edits/i);
});

test("short prompts delegate to the contract files", async () => {
  const initPromptRaw = await readFile(path.join(packageRoot, "prompts", "init.prompt.md"), "utf8");
  const refactorPromptRaw = await readFile(path.join(packageRoot, "prompts", "refactor.prompt.md"), "utf8");

  assert.match(initPromptRaw, /prompts\/init-contract\.md/);
  assert.match(initPromptRaw, /skills\/init-workflow\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/feature-shaping\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/simplicity-audit\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/change-synchronization\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/test-scope-selection\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/readme-authoring\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/http-api-conventions\/SKILL\.md/);
  assert.match(refactorPromptRaw, /prompts\/refactor-contract\.md/);
  assert.match(refactorPromptRaw, /skills\/refactor-workflow\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/feature-shaping\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/simplicity-audit\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/change-synchronization\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/test-scope-selection\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/http-api-conventions\/SKILL\.md/);
});
