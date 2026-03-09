import { readFile } from "node:fs/promises";
import path from "node:path";

function printIndentedLines(lines) {
  for (const line of lines) {
    console.log(`  ${line}`);
  }
}

export function printInitGuidance(targetPath) {
  console.log(`Project created at ${targetPath}`);
  console.log("Guided next steps:");
  printIndentedLines([
    "1. Review AGENTS.md and ai/contract.json before making implementation changes.",
    "2. If AI adapters are enabled, open your assistant adapter under ai/ (for example ai/codex.md).",
    "3. Open prompts/init.prompt.md and paste it into your LLM together with your task brief.",
    "4. Tell the LLM to execute npm run check itself and fix any failures before finishing.",
    "5. Implement the feature without editing managed files unless this is a standards update.",
  ]);
}

export async function printRefactorGuidance(targetPath) {
  const promptPath = path.join(targetPath, "prompts", "refactor.prompt.md");

  console.log(`Project refactored at ${targetPath}`);
  console.log("Legacy code was moved into .code-standards/refactor-source/latest/ for reference.");
  console.log("The snapshot is legacy reference only. Do not restore managed files or toolchain files from it.");
  console.log("The LLM MUST analyze the legacy code and then rebuild on the fresh scaffold. It MUST NOT copy the legacy structure as-is.");
  console.log("No lint, format, or check pass was run against the intermediate refactor state.");
  console.log("Final npm run check is deferred until after the LLM rewrites src/ and test/.");

  try {
    const prompt = await readFile(promptPath, "utf8");

    console.log("Copy/paste this prompt into your LLM:");
    console.log("");
    console.log("----- BEGIN REFACTOR PROMPT -----");
    console.log(prompt.trimEnd());
    console.log("----- END REFACTOR PROMPT -----");
  } catch {
    console.log(`Refactor prompt written to ${promptPath}`);
  }
}
