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
    "1. Open PROMPT.md and complete the Implementation Request section.",
    "2. Start with prompts/init.prompt.md. That phase should only produce the plan and Phase 2 reads.",
    "3. Continue with prompts/init-phase-2-implement.md after phase 1 is complete.",
    "4. Finish with prompts/init-phase-3-verify.md so the LLM runs npm run check and updates SCAFFOLD-FEEDBACK.md.",
    "5. Load optional skills only when the phase prompt says they are needed.",
    "6. Remember that Biome ignores managed contract files by default, and single-return stays strict outside src/http/.",
  ]);
}

export async function printRefactorGuidance(targetPath) {
  const promptPath = path.join(targetPath, "PROMPT.md");

  console.log(`Project refactored at ${targetPath}`);
  console.log("Legacy code was moved into .code-standards/refactor-source/latest/ for reference.");
  console.log("The snapshot is legacy reference only. Do not restore managed files or toolchain files from it.");
  console.log("The LLM MUST analyze the legacy code and then rebuild on the fresh scaffold. It MUST NOT copy the legacy structure as-is.");
  console.log("No lint, format, or check pass was run against the intermediate refactor state.");
  console.log("Final npm run check is deferred until after the LLM rewrites src/ and test/.");
  console.log("Use the sequential phase prompts instead of pasting one giant prompt.");

  try {
    const prompt = await readFile(promptPath, "utf8");

    console.log("Start from this operator checklist:");
    console.log("");
    console.log("----- BEGIN PROMPT CHECKLIST -----");
    console.log(prompt.trimEnd());
    console.log("----- END PROMPT CHECKLIST -----");
  } catch {
    console.log(`Refactor prompt written to ${promptPath}`);
  }
}
