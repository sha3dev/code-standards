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
    "1. Review AGENTS.md, SKILLS.md, and ai/contract.json before making implementation changes.",
    "2. If AI adapters are enabled, open your assistant adapter under ai/ (for example ai/codex.md).",
    "3. Open skills/init-workflow/SKILL.md before implementing the first behavior in the scaffold.",
    "4. Also open skills/feature-shaping/SKILL.md, skills/simplicity-audit/SKILL.md, and skills/change-synchronization/SKILL.md.",
    "5. If the task changes behavior, also open skills/test-scope-selection/SKILL.md.",
    "6. If the task changes README.md, also open skills/readme-authoring/SKILL.md.",
    "7. If this is a service or the task changes HTTP endpoints, also open skills/http-api-conventions/SKILL.md.",
    "8. Open PROMPT.md in the project root and complete the final Implementation Request section.",
    "9. Paste the full contents of PROMPT.md into your LLM.",
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
