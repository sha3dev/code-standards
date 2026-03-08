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

  assert.deepEqual(promptFiles, ["prompts/init.prompt.md", "prompts/refactor.prompt.md"]);
});

test("renderPromptFiles materializes prompts into the target repo", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-prompt-files-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await renderPromptFiles(packageRoot, targetDir, { projectName: "demo-project", packageName: "@scope/demo", packageVersion: "0.9.0", year: "2026" });

  const generatedRefactorPrompt = await readFile(path.join(targetDir, "prompts", "refactor.prompt.md"), "utf8");
  const sourceRefactorPrompt = await readFile(path.join(packageRoot, "prompts", "refactor.prompt.md"), "utf8");

  assert.equal(generatedRefactorPrompt, sourceRefactorPrompt);
});

test("managed prompts require the LLM to execute npm run check itself", async () => {
  for (const promptPath of ["prompts/init.prompt.md", "prompts/refactor.prompt.md"]) {
    const promptRaw = await readFile(path.join(packageRoot, promptPath), "utf8");

    assert.match(promptRaw, /execute `npm run check` yourself before finishing/);
    assert.match(promptRaw, /fix the issues and rerun it until it passes/);
  }
});
