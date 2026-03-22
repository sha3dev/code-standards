import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { collectTemplateFiles, mirrorFile } from "../utils/fs.mjs";

async function readPromptTemplateFiles(packageRoot) {
  return collectTemplateFiles(path.join(packageRoot, "prompts"));
}

async function buildRootPrompt(packageRoot, targetDir, tokens, workflow) {
  const promptPath = path.join(packageRoot, "prompts", `${workflow}.prompt.md`);
  const promptRaw = await readFile(promptPath, "utf8");
  const renderedPrompt = promptRaw.replaceAll("{{projectName}}", tokens.projectName ?? "");
  const rootPromptPath = path.join(targetDir, "PROMPT.md");
  const phasePaths =
    workflow === "init"
      ? ["prompts/init.prompt.md", "prompts/init-phase-2-implement.md", "prompts/init-phase-3-verify.md"]
      : ["prompts/refactor.prompt.md", "prompts/refactor-phase-2-rebuild.md", "prompts/refactor-phase-3-verify.md"];
  const implementationHeading = workflow === "init" ? "## Implementation Request" : "## Refactor Request";
  const implementationLines =
    workflow === "init"
      ? [
          "Complete this section before starting phase 1.",
          "Describe the behavior you want to implement, the expected public API, runtime constraints, and any explicit non-goals.",
          "",
          "Task:",
          "- ",
          "",
          "Public API:",
          "- ",
          "",
          "Runtime constraints:",
          "- ",
          "",
          "Non-goals:",
          "- ",
          "",
        ]
      : [
          "Complete this section before starting phase 1.",
          "Describe the contracts that must survive the refactor, the intended target behavior, runtime constraints, and anything that should intentionally not be preserved.",
          "",
          "Task:",
          "- ",
          "",
          "Must preserve:",
          "- ",
          "",
          "Can simplify or drop:",
          "- ",
          "",
          "Runtime constraints:",
          "- ",
          "",
        ];
  const promptBody = [
    "# Sequential LLM Workflow",
    "",
    `This repository is prepared for the \`${workflow}\` workflow.`,
    "Do not paste this whole file into the LLM.",
    "Use it as the operator checklist and send only the current phase prompt plus the minimum required context for that phase.",
    "",
    "## Execution Order",
    "",
    "1. Complete the request section in this file.",
    `2. Start with \`${phasePaths[0]}\` and stop after that phase output.`,
    `3. Continue with \`${phasePaths[1]}\` only after phase 1 is complete.`,
    `4. Finish with \`${phasePaths[2]}\` to validate, close gaps, and prepare the final response.`,
    "5. Load optional skills only when their trigger condition actually applies.",
    "",
    "## Always True",
    "",
    "- You MUST implement the task without editing managed files unless this is a standards update.",
    "- Managed files are ignored by Biome by default; do not remove those ignores during normal feature work.",
    "- `single-return` stays strict outside `src/http/**`; in HTTP transport files, early returns are allowed when they keep validation and response flow clearer.",
    "- You MUST execute `npm run check` yourself before finishing.",
    "- If `npm run check` fails, you MUST fix the issues and rerun it until it passes.",
    "- As the final step, you MUST create or update `SCAFFOLD-FEEDBACK.md` in the project root with concrete feedback on scaffold issues, ambiguities, friction, and improvements.",
    "",
    "## Phase Files",
    "",
    ...phasePaths.map((phasePath) => `- \`${phasePath}\``),
    "",
    "## Phase 1 Entry Prompt",
    "",
    renderedPrompt.trimEnd(),
    "",
    implementationHeading,
    "",
    ...implementationLines,
  ].join("\n");

  return { promptBody, rootPromptPath };
}

export async function renderPromptFiles(packageRoot, targetDir, tokens, workflow = "init") {
  const promptFiles = await readPromptTemplateFiles(packageRoot);

  for (const promptFile of promptFiles) {
    await mirrorFile(promptFile.sourcePath, path.join(targetDir, "prompts", promptFile.targetRelativePath), tokens);
  }

  const { promptBody, rootPromptPath } = await buildRootPrompt(packageRoot, targetDir, tokens, workflow);
  await writeFile(rootPromptPath, promptBody, "utf8");
}

export async function collectPromptFiles(packageRoot) {
  const promptFiles = await readPromptTemplateFiles(packageRoot);
  return ["PROMPT.md", ...promptFiles.map((promptFile) => path.join("prompts", promptFile.targetRelativePath))].sort((left, right) =>
    left.localeCompare(right),
  );
}
