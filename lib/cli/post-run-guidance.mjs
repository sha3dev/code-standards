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

export function printRefactorGuidance(targetPath) {
  console.log(`Project refactored at ${targetPath}`);
  console.log("LLM handoff steps:");
  printIndentedLines([
    "1. Review AGENTS.md and ai/contract.json in the rebuilt repo.",
    "2. Open prompts/refactor.prompt.md and paste it into your LLM.",
    "3. Give the LLM the refactor artifacts under .code-standards/refactor-source/: public-contract.json, preservation.json, analysis-summary.md, and latest/.",
    "4. Tell the LLM to execute npm run check itself and fix any failures before finishing.",
    "5. Rebuild the domain code inside src/ and test/ without editing managed files unless this is a standards update.",
  ]);
}
