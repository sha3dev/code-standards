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
    "prompts/init-phase-2-implement.md",
    "prompts/init-phase-3-verify.md",
    "prompts/init.prompt.md",
    "prompts/refactor-contract.md",
    "prompts/refactor-phase-2-rebuild.md",
    "prompts/refactor-phase-3-verify.md",
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
  assert.match(rootPrompt, /Sequential LLM Workflow/);
  assert.match(rootPrompt, /Do not paste this whole file into the LLM/);
  assert.match(rootPrompt, /prompts\/init\.prompt\.md/);
  assert.match(rootPrompt, /prompts\/init-phase-2-implement\.md/);
  assert.match(rootPrompt, /prompts\/init-phase-3-verify\.md/);
  assert.match(rootPrompt, /## Implementation Request/);
  assert.match(rootPrompt, /Complete this section before starting phase 1/);
  assert.match(rootPrompt, /execute `npm run check` yourself before finishing/);
  assert.match(rootPrompt, /fix the issues and rerun it until it passes/);
  assert.match(rootPrompt, /without editing managed files unless this is a standards update/);
  assert.match(rootPrompt, /Managed files are ignored by Biome by default/);
  assert.match(rootPrompt, /single-return` stays strict outside `src\/http\/\*\*`/);
  assert.match(rootPrompt, /create or update `SCAFFOLD-FEEDBACK\.md`/);
});

test("renderPromptFiles can render a refactor-specific root prompt", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-prompt-files-refactor-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await renderPromptFiles(
    packageRoot,
    targetDir,
    { projectName: "demo-project", packageName: "@scope/demo", packageVersion: "0.9.0", year: "2026" },
    "refactor",
  );

  const rootPrompt = await readFile(path.join(targetDir, "PROMPT.md"), "utf8");

  assert.match(rootPrompt, /prepared for the `refactor` workflow/);
  assert.match(rootPrompt, /prompts\/refactor\.prompt\.md/);
  assert.match(rootPrompt, /prompts\/refactor-phase-2-rebuild\.md/);
  assert.match(rootPrompt, /prompts\/refactor-phase-3-verify\.md/);
  assert.match(rootPrompt, /## Refactor Request/);
});

test("contract prompts require the LLM to execute npm run check itself", async () => {
  for (const promptPath of ["prompts/init-contract.md", "prompts/refactor-contract.md"]) {
    const promptRaw = await readFile(path.join(packageRoot, promptPath), "utf8");

    assert.match(promptRaw, /execute `npm run check` yourself before finishing/);
    assert.match(promptRaw, /fix the issues and rerun it until it passes/);
    assert.match(promptRaw, /create or update `SCAFFOLD-FEEDBACK\.md`/);
  }
});

test("refactor contract delegates the procedural workflow to the refactor skill", async () => {
  const promptRaw = await readFile(path.join(packageRoot, "prompts", "refactor-contract.md"), "utf8");

  assert.match(promptRaw, /skills\/refactor-workflow\/SKILL\.md/);
  assert.doesNotMatch(promptRaw, /copying legacy files into the new scaffold and making only superficial edits/i);
});

test("short prompts delegate to the contract files", async () => {
  const initPromptRaw = await readFile(path.join(packageRoot, "prompts", "init.prompt.md"), "utf8");
  const initPhase2Raw = await readFile(path.join(packageRoot, "prompts", "init-phase-2-implement.md"), "utf8");
  const initPhase3Raw = await readFile(path.join(packageRoot, "prompts", "init-phase-3-verify.md"), "utf8");
  const refactorPromptRaw = await readFile(path.join(packageRoot, "prompts", "refactor.prompt.md"), "utf8");
  const refactorPhase2Raw = await readFile(path.join(packageRoot, "prompts", "refactor-phase-2-rebuild.md"), "utf8");
  const refactorPhase3Raw = await readFile(path.join(packageRoot, "prompts", "refactor-phase-3-verify.md"), "utf8");

  assert.match(initPromptRaw, /This is phase 1 of the init workflow/);
  assert.match(initPromptRaw, /PROMPT\.md/);
  assert.match(initPromptRaw, /skills\/init-workflow\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/feature-shaping\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/simplicity-audit\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/change-synchronization\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/test-scope-selection\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/readme-authoring\/SKILL\.md/);
  assert.match(initPromptRaw, /skills\/http-api-conventions\/SKILL\.md/);
  assert.match(initPhase2Raw, /prompts\/init-contract\.md/);
  assert.match(initPhase3Raw, /npm run check/);
  assert.match(refactorPromptRaw, /This is phase 1 of the refactor workflow/);
  assert.match(refactorPromptRaw, /PROMPT\.md/);
  assert.match(refactorPromptRaw, /skills\/refactor-workflow\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/feature-shaping\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/simplicity-audit\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/change-synchronization\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/test-scope-selection\/SKILL\.md/);
  assert.match(refactorPromptRaw, /skills\/http-api-conventions\/SKILL\.md/);
  assert.match(refactorPhase2Raw, /prompts\/refactor-contract\.md/);
  assert.match(refactorPhase3Raw, /npm run check/);
});
