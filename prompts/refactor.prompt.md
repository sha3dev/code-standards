Read these files before making any implementation changes:

- `AGENTS.md`
- `ai/contract.json`
- `ai/rules.md`
- `.code-standards/refactor-source/public-contract.json`
- `.code-standards/refactor-source/preservation.json`
- `.code-standards/refactor-source/analysis-summary.md`

Your job is to rewrite the project into the fresh scaffold under `src/` and `test/` following the rules in `ai/rules.md`.

Requirements:

- preserve only the contracts explicitly marked for preservation
- use the snapshot under `.code-standards/refactor-source/latest/` as reference, not as a structure to copy blindly
- execute `npm run check` yourself before finishing
- if `npm run check` fails, fix the issues and rerun it until it passes

Finish with:

- changed files
- preserved contracts checklist
- intentionally broken or non-preserved items, if any
- proof that `npm run check` passed
