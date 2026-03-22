# @sha3/code-standards

Scaffold TypeScript projects, rebuild them with `refactor`, and enforce repository policy with `verify`.

## TL;DR

Create a new project:

```bash
npx @sha3/code-standards init --template node-service --yes
```

Realign an existing repo:

```bash
npx @sha3/code-standards refactor --yes
```

Run verification for humans:

```bash
npx @sha3/code-standards verify
```

Run verification for automation:

```bash
npx @sha3/code-standards verify --report json
```

Explain a deterministic rule:

```bash
npx @sha3/code-standards verify --explain single-return
```

## Installation

Use it directly with `npx`:

```bash
npx @sha3/code-standards --help
```

Or install it in a repo:

```bash
npm install -D @sha3/code-standards
```

## Compatibility

- Node.js 20.11+
- ESM package runtime
- TypeScript-first projects
- Biome as the baseline formatter and linter

## What It Does

`@sha3/code-standards` manages 3 different concerns:

- `init`: creates a standards-managed TypeScript scaffold
- `refactor`: snapshots an existing repo and rebuilds it onto the managed scaffold
- `verify`: enforces repository policy that generic tooling does not cover well

That last part matters: `verify` is not another formatter or typechecker. It is the package-specific policy engine for generated repos.
Generated scaffolds are also expected to ship package-grade README files rather than placeholder docs.

## Non-Negotiables

Simplicity is mandatory.

- choose the simplest correct implementation for the current requirement
- avoid speculative abstractions, helper layers, wrappers, and extension points without immediate need
- if two solutions are both correct, prefer the smaller and more direct one
- do not remove valid responsibility boundaries in the name of simplicity
- simplicity means avoiding gratuitous complexity, not reducing structure blindly
- let Biome decide final wrapping; prefer compact code, but do not force single-line layouts that the formatter keeps multiline

## Public API

### CLI commands

```txt
code-standards init
code-standards refactor
code-standards profile
code-standards verify
```

### Package exports

```txt
@sha3/code-standards/biome
@sha3/code-standards/tsconfig/base.json
@sha3/code-standards/tsconfig/node-lib.json
@sha3/code-standards/tsconfig/node-service.json
```

### `verify` options

```txt
code-standards verify [--report text|json] [--only <rule-id[,rule-id...]>] [--files <path[,path...]>] [--strict]
code-standards verify --explain <rule-id>
```

Behavior notes:

- `init` always works in the current directory and creates a fresh scaffold.
- `refactor` always works in the current directory and never accepts a remote or local source argument.
- `refactor` snapshots the previous repo state under `.code-standards/refactor-source/` before rebuilding managed files.
- `verify` is the project-policy checker. It complements Biome and TypeScript instead of replacing them.
- `verify --report json` is intended for CI, PR automation, and scripts.
- default `verify` fails only on `error` severity; `--strict` also fails on `warning`.
- `verify --explain <rule-id>` prints operational documentation for a rule without checking the repo.
- `code-standards verify --help` prints the same option surface shown above.

### What `verify` checks

`verify` covers project policy that is specific to `@sha3/code-standards`, including:

- contract presence and validity for `AGENTS.md` and `ai/contract.json`
- metadata sync between `package.json.codeStandards` and `ai/contract.json`
- required managed files from the active template
- required README sections
- README documentation for public exports and public class methods
- HTTP API documentation for service templates
- TypeScript-only source policy in `src/` and `test/`
- deterministic AST rules such as `single-return`, `async-await-only`, `canonical-config-import`, and file naming rules
- `single-return` stays strict in `src/` except for `src/http/**`, where transport handlers may use early returns when that keeps request flow clearer

### What `verify` does not check

`verify` does not replace the generic toolchain:

- formatting, line wrapping, and generic lint rules stay in Biome
- type correctness stays in TypeScript
- runtime behavior stays in tests

### When to use `verify`

Use the tools together, not interchangeably:

- run Biome when you want style, formatting, and baseline lint feedback
- run TypeScript when you want type-safety feedback
- run `verify` when you want to enforce repository contract, scaffold integrity, and project-policy rules

## Integration Guide

### Create a new project

```bash
mkdir my-service
cd my-service
npx @sha3/code-standards init --template node-service --yes
```

### `init` step by step

Use `init` when you are starting a new repo from the managed scaffold.

1. Create and enter the target directory.
2. Run `init` with the template you want.
3. Review the generated contract files before asking an LLM to write code.
4. Use the generated phase prompts one at a time together with your feature brief.
5. Make the LLM execute `npm run check` itself and fix any failures before it finishes.

Minimal flow:

```bash
mkdir my-service
cd my-service
npx @sha3/code-standards init --template node-service --yes
```

What `init` generates for you:

- `AGENTS.md` as the repo policy entrypoint
- `SKILLS.md` as the index of specialized workflows that should only be loaded when relevant
- `ai/contract.json` as the deterministic standards contract
- `ai/rules.md` as the concise human-readable implementation rules file for the LLM
- `skills/*` workflow guides such as init, refactor, feature shaping, simplicity audit, change synchronization, test scope selection, HTTP API conventions, and README authoring
- `ai/<assistant>.md` adapter files when AI adapters are enabled
- `PROMPT.md` in the project root as the operator checklist and request sheet for the phased LLM workflow
- `prompts/init.prompt.md`, `prompts/init-phase-2-implement.md`, and `prompts/init-phase-3-verify.md` as the sequential init prompts
- the managed `src/`, `test/`, config, and package surface for the selected template
- a README scaffold that is meant to be rewritten into package-grade integration documentation once real behavior exists
- a root `SCAFFOLD-FEEDBACK.md` handoff requirement in the generated workflow so the LLM leaves scaffold/process feedback after implementation

The CLI also prints these next steps to the console after `init` completes, so the user does not have to infer the LLM workflow manually.

Recommended LLM workflow after `init`:

1. Open `PROMPT.md`.
2. Complete the final `Implementation Request` section.
3. Start with `prompts/init.prompt.md`. That phase should only produce a plan, assumptions, and a `Phase 2 reads` list.
4. Continue with `prompts/init-phase-2-implement.md` using only the approved plan output and the files named in `Phase 2 reads`.
5. Finish with `prompts/init-phase-3-verify.md` so the LLM runs verification and closes the task.
6. Load optional skills only when the active phase prompt says they are needed.

Minimal request example for `PROMPT.md`:

```txt
Task:
- Build the first HTTP endpoint for service health.
- Keep the generated scaffold structure intact.
- Add tests for the new behavior.
```

The final phase must explicitly require the LLM to execute:

```bash
npm run check
```

The final phase must also require the LLM to fix any failing checks, rewrite `README.md` when behavior changes, and create or update `SCAFFOLD-FEEDBACK.md`.

### Regenerate an existing repo

Run this from the project root:

```bash
npx @sha3/code-standards refactor --yes
```

`refactor` will:

1. analyze the current repository
2. capture preservation decisions
3. write `.code-standards/refactor-source/latest/`
4. write `public-contract.json`, `preservation.json`, and `analysis-summary.md`
5. rebuild the managed scaffold
6. generate a phased refactor handoff for the LLM

### `refactor` step by step

Use `refactor` when you already have a repo and want to rebuild it onto the managed scaffold without losing the contracts you choose to preserve.

1. Go to the root of the existing project.
2. Run `refactor`.
3. Answer the preservation questions if you are in interactive mode.
4. Let the command move the legacy code into `.code-standards/refactor-source/latest/` and rebuild the managed surface.
5. Open `PROMPT.md` and the generated refactor artifacts.
6. Use the refactor phase prompts one at a time so the LLM can rebuild the domain code into the fresh scaffold.
7. Require the LLM to execute `npm run check` itself and fix any failures before it finishes.
8. Require the LLM to finish by creating or updating `SCAFFOLD-FEEDBACK.md` with concrete scaffold/process feedback.

Typical command:

```bash
npx @sha3/code-standards refactor --yes
```

If you want dependencies installed as part of the run:

```bash
npx @sha3/code-standards refactor --yes --install
```

After `refactor`, these files matter most:

- `PROMPT.md`
- `AGENTS.md`
- `SKILLS.md`
- `skills/feature-shaping/SKILL.md`
- `skills/simplicity-audit/SKILL.md`
- `skills/change-synchronization/SKILL.md`
- `skills/test-scope-selection/SKILL.md`
- `skills/http-api-conventions/SKILL.md`
- `ai/contract.json`
- `ai/rules.md`
- `skills/refactor-workflow/SKILL.md`
- `.code-standards/refactor-source/public-contract.json`
- `.code-standards/refactor-source/preservation.json`
- `.code-standards/refactor-source/analysis-summary.md`
- `.code-standards/refactor-source/latest/`
- `prompts/refactor.prompt.md`
- `prompts/refactor-phase-2-rebuild.md`
- `prompts/refactor-phase-3-verify.md`

The CLI prints the operator checklist after `refactor` completes. The normal flow is: run `refactor`, complete `PROMPT.md`, start with `prompts/refactor.prompt.md`, then continue phase by phase.

Important behavior note:

- `refactor` does not run `npm run fix` or `npm run check` against the intermediate refactor state.
- `refactor` does not run the final `npm run check` against the pre-refactor codebase.
- The old implementation is moved to `.code-standards/refactor-source/latest/` as reference material.
- The final validation belongs to the rewritten `src/` and `test/` produced after the LLM handoff.

Recommended LLM workflow after `refactor`:

1. Run `refactor` and wait for it to complete.
2. Open `PROMPT.md` and complete the `Refactor Request` section.
3. Start with `prompts/refactor.prompt.md`. That phase should only return preserved contracts, risks, and a `Phase 2 reads` list.
4. Continue with `prompts/refactor-phase-2-rebuild.md` using only the approved phase 1 output and the files named in `Phase 2 reads`.
5. Finish with `prompts/refactor-phase-3-verify.md` so the LLM runs verification and closes the task.

Minimal request example for `PROMPT.md`:

```txt
Task:
- Rebuild the application behavior inside the fresh scaffold under src/ and test/.
- Preserve the public API and HTTP contracts captured in the refactor artifacts.
- Do not edit managed files unless a standards update is explicitly required.
```

6. Let each phase load only the files named by that phase prompt instead of reloading the whole refactor pack every time.
7. Make the final phase rewrite `README.md` as package-grade integration documentation for the rebuilt public API and runtime behavior when needed.
8. In the final phase, explicitly require the LLM to execute:

```bash
npm run check
```

9. Require the LLM to fix any failing checks and rerun the command until it passes.

Practical rule: `refactor` prepares the repo and the context pack; the LLM should consume that pack incrementally through the phase prompts instead of in one large prompt.

### Verify a project

Human-readable verification:

```bash
npx @sha3/code-standards verify
```

Machine-readable verification:

```bash
npx @sha3/code-standards verify --report json
```

Focused verification by rule:

```bash
npx @sha3/code-standards verify --only single-return,canonical-config-import
```

Focused verification by files:

```bash
npx @sha3/code-standards verify --files src/user/user.service.ts,test/user.test.ts
```

Strict verification:

```bash
npx @sha3/code-standards verify --strict
```

Combined scope control:

```bash
npx @sha3/code-standards verify --report json --only single-return --files src/user/user.service.ts
```

Rule explanation:

```bash
npx @sha3/code-standards verify --explain single-return
```

`verify` is the command generated projects use behind `npm run standards:check`.

## Configuration

Generated projects centralize runtime constants in `src/config.ts`.

This package centralizes standards through:

- [`standards/manifest.json`](/Users/jc/Documents/GitHub/code-standards/standards/manifest.json) as the canonical standards manifest
- [`profiles/default.profile.json`](/Users/jc/Documents/GitHub/code-standards/profiles/default.profile.json) as the default AI profile
- [`biome.json`](/Users/jc/Documents/GitHub/code-standards/biome.json) as the shared Biome config export

Profile-driven behavior can be customized with:

```bash
npx @sha3/code-standards profile --profile ./profiles/team.profile.json
```

Then applied during `init` or `refactor` with `--profile`.

## Scripts

Repository-level scripts:

- `npm run check`: standards validation, profile validation, AI resource validation, Biome lint, Biome format check, typecheck, tests
- `npm run fix`: Biome write + format write
- `npm run lint`: `biome check .`
- `npm run format:check`: `biome format .`
- `npm run typecheck`: TypeScript validation
- `npm run test`: smoke fixtures plus Node test runner

Generated project scripts:

- `npm run standards:check`: `code-standards verify`
- `npm run check`: standards + lint + format + typecheck + tests
- `npm run fix`: Biome autofix + format write

## Structure

Key repository paths:

- `bin/code-standards.mjs`: CLI entrypoint
- `lib/cli/run-init.mjs`: project initialization flow
- `lib/cli/run-refactor.mjs`: in-place refactor flow
- `lib/cli/run-verify.mjs`: deterministic verification flow
- `lib/verify/`: issue model, explain mode, renderers, project checks, and AST-level source rules
- `templates/`: `node-lib` and `node-service` managed scaffolds
- `prompts/`: starter prompts for `init` and `refactor`
- `resources/ai/`: AI contract templates, adapters, examples, and rule catalog

## Troubleshooting

### `biome: command not found`

Install dependencies in the current workspace:

```bash
npm install
```

### `refactor` says `package.json` was not found

Run `code-standards refactor` from the root of the target project.

### Verify Modes

`verify` has 5 useful modes:

- default text mode: human-readable errors to `stderr`
- `--report json`: structured output to `stdout`
- `--only`: execute only selected rule ids
- `--files`: limit file-oriented checks to a subset of files
- `--strict`: fail on warnings as well as errors
- `--explain`: print documentation for one rule instead of verifying the repo

Important behavior:

- project-wide contract checks still run even when `--files` is used
- file-oriented checks such as AST source rules and TypeScript-only checks are scoped by `--files`
- `--explain` cannot be combined with `--report`, `--only`, or `--files`
- `text` remains the default output mode to preserve human-friendly local usage

### Verify Output

Example text output:

```txt
- ERROR [single-return] src/user/user.service.ts: functions and methods outside src/http/ must use a single return statement
- WARNING [large-class-heuristic/heuristic] src/user/user.service.ts: very large classes should be decomposed into smaller cohesive units
Verification failed with 1 error(s) and 1 warning(s).
```

Example JSON output:

```json
{
  "ok": false,
  "hasWarnings": true,
  "issues": [
    {
      "ruleId": "single-return",
      "category": "source-rule",
      "severity": "error",
      "message": "functions and methods outside src/http/ must use a single return statement",
      "relativePath": "src/user/user.service.ts",
      "enforcedBy": "verify"
    }
  ],
  "summary": {
    "issueCount": 1,
    "errorCount": 1,
    "warningCount": 0,
    "auditCount": 0,
    "checkedRuleIds": ["single-return"],
    "checkedFiles": ["src/user/user.service.ts"]
  }
}
```

Exit code behavior:

- exit code `0`: verification passed at the requested severity threshold
- exit code non-zero: verification found blocking severities for the current mode or arguments were invalid

### Using verify in CI

Save a structured report:

```bash
npx @sha3/code-standards verify --report json > verify-report.json
```

Fail a script based on the result:

```bash
node -e 'const fs=require("node:fs"); const report=JSON.parse(fs.readFileSync("verify-report.json","utf8")); if(!report.ok) process.exit(1)'
```

Run a targeted CI check for a narrow rule:

```bash
npx @sha3/code-standards verify --report json --only single-return
```

### Troubleshooting verify

If `verify` fails, first decide what kind of failure it is:

- contract/metadata/layout problem: check `AGENTS.md`, `ai/contract.json`, `package.json.codeStandards`, or missing scaffold files
- source-rule problem: use the reported `ruleId`, file path, and `verify --explain <rule-id>`
- README problem: restore the required sections

Common cases:

- unknown rule id in `--only`: use `code-standards verify --explain <rule-id>` or inspect `resources/ai/rule-catalog.json`
- too much output: narrow the run with `--only` or `--files`
- Biome and TypeScript pass but `verify` fails: expected, because `verify` checks product policy and contract rules that generic tooling does not cover, but line-wrapping disputes should now be treated as Biome territory

### Required README headings in generated projects

Keep these headings in generated projects, at minimum:

- for both templates: `## TL;DR`, `## Why`, `## Main Capabilities`, `## Installation`, `## Usage`, `## Examples`, `## Public API`, `## Configuration`, `## Compatibility`, `## Scripts`, `## Structure`, `## Troubleshooting`, `## AI Workflow`
- for `node-service` also: `## Running Locally` and `## HTTP API`

### VS Code formatting conflicts

Use the `biomejs.biome` extension as the default formatter for generated projects.

## AI Workflow

Generated projects treat these files as the local AI contract:

1. `ai/contract.json`
2. `AGENTS.md`
3. `SKILLS.md`
4. `skills/*`
5. `ai/rules.md`
6. `ai/<assistant>.md`

Recommended bootstrap prompt:

```txt
Before generating code:
- Read AGENTS.md, SKILLS.md, ai/contract.json, ai/rules.md, and ai/<assistant>.md.
- Load `skills/init-workflow/SKILL.md`, `skills/feature-shaping/SKILL.md`, `skills/simplicity-audit/SKILL.md`, and `skills/change-synchronization/SKILL.md` for init-based implementation.
- Load `skills/refactor-workflow/SKILL.md`, `skills/feature-shaping/SKILL.md`, `skills/simplicity-audit/SKILL.md`, and `skills/change-synchronization/SKILL.md` for refactor work.
- Load `skills/test-scope-selection/SKILL.md` for meaningful behavior changes, `skills/readme-authoring/SKILL.md` whenever README changes, and `skills/http-api-conventions/SKILL.md` whenever HTTP endpoints exist or change.
- Summarize the `error` rules and the `warning` rules you will review carefully.
- Implement the task without editing managed files unless this is a standards update.
- Run npm run check and fix all failures before finishing.
```

For a standards migration on an existing repo, run `refactor` first and then use the generated files under `.code-standards/refactor-source/` as reference context for the rewrite.
