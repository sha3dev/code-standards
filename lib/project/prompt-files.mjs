import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { collectTemplateFiles, mirrorFile } from "../utils/fs.mjs";

async function readPromptTemplateFiles(packageRoot) {
  return collectTemplateFiles(path.join(packageRoot, "prompts"));
}

async function buildRootInitPrompt(packageRoot, targetDir, tokens) {
  const initPromptPath = path.join(packageRoot, "prompts", "init.prompt.md");
  const initPromptRaw = await readFile(initPromptPath, "utf8");
  const renderedPrompt = initPromptRaw.replaceAll("{{projectName}}", tokens.projectName ?? "");
  const rootPromptPath = path.join(targetDir, "PROMPT.md");
  const promptBody = [
    renderedPrompt.trimEnd(),
    "",
    "## Non-Negotiables",
    "",
    "- You MUST load `skills/init-workflow/SKILL.md` before implementing the task.",
    "- You MUST also load `skills/feature-shaping/SKILL.md`, `skills/simplicity-audit/SKILL.md`, and `skills/change-synchronization/SKILL.md`.",
    "- If the task introduces meaningful behavior changes, you MUST also load `skills/test-scope-selection/SKILL.md`.",
    "- If the task updates `README.md`, you MUST also load `skills/readme-authoring/SKILL.md`.",
    "- If the project is a `node-service` or the task changes HTTP endpoints, you MUST also load `skills/http-api-conventions/SKILL.md`.",
    "- You MUST execute `npm run check` yourself before finishing.",
    "- If `npm run check` fails, you MUST fix the issues and rerun it until it passes.",
    "- You MUST implement the task without editing managed files unless this is a standards update.",
    "",
    "## Implementation Request",
    "",
    "Complete this section before sending the prompt to your LLM.",
    "Describe the behavior you want to implement, the expected public API, any runtime constraints, and any non-goals.",
    "",
    "Task:",
    "- ",
    "",
  ].join("\n");

  return { promptBody, rootPromptPath };
}

export async function renderPromptFiles(packageRoot, targetDir, tokens) {
  const promptFiles = await readPromptTemplateFiles(packageRoot);

  for (const promptFile of promptFiles) {
    await mirrorFile(promptFile.sourcePath, path.join(targetDir, "prompts", promptFile.targetRelativePath), tokens);
  }

  const { promptBody, rootPromptPath } = await buildRootInitPrompt(packageRoot, targetDir, tokens);
  await writeFile(rootPromptPath, promptBody, "utf8");
}

export async function collectPromptFiles(packageRoot) {
  const promptFiles = await readPromptTemplateFiles(packageRoot);
  return ["PROMPT.md", ...promptFiles.map((promptFile) => path.join("prompts", promptFile.targetRelativePath))].sort((left, right) =>
    left.localeCompare(right),
  );
}
