import path from "node:path";

import { collectTemplateFiles, mirrorFile } from "../utils/fs.mjs";

async function readPromptTemplateFiles(packageRoot) {
  return collectTemplateFiles(path.join(packageRoot, "prompts"));
}

export async function renderPromptFiles(packageRoot, targetDir, tokens) {
  const promptFiles = await readPromptTemplateFiles(packageRoot);

  for (const promptFile of promptFiles) {
    await mirrorFile(promptFile.sourcePath, path.join(targetDir, "prompts", promptFile.targetRelativePath), tokens);
  }
}

export async function collectPromptFiles(packageRoot) {
  const promptFiles = await readPromptTemplateFiles(packageRoot);
  return promptFiles.map((promptFile) => path.join("prompts", promptFile.targetRelativePath)).sort((left, right) => left.localeCompare(right));
}
