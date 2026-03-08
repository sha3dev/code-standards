# @sha3/code-standards

Scaffold TypeScript projects, rebuild them with `refactor`, and enforce deterministic project policy with `verify`.

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
- `verify`: enforces deterministic project policy that generic tooling does not cover well

That last part matters: `verify` is not another formatter or typechecker. It is the package-specific policy engine for generated repos.

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
code-standards verify [--report text|json] [--only <rule-id[,rule-id...]>] [--files <path[,path...]>]
code-standards verify --explain <rule-id>
```

Behavior notes:

- `init` always works in the current directory and creates a fresh scaffold.
- `refactor` always works in the current directory and never accepts a remote or local source argument.
- `refactor` snapshots the previous repo state under `.code-standards/refactor-source/` before rebuilding managed files.
- `verify` is the deterministic checker for project policy. It complements Biome and TypeScript instead of replacing them.
- `verify --report json` is intended for CI, PR automation, and scripts.
- `verify --explain <rule-id>` prints operational documentation for a rule without checking the repo.
- `code-standards verify --help` prints the same option surface shown above.

### What `verify` checks

`verify` covers project policy that is specific to `@sha3/code-standards`, including:

- contract presence and validity for `AGENTS.md` and `ai/contract.json`
- metadata sync between `package.json.codeStandards` and `ai/contract.json`
- required managed files from the active template
- required README sections
- TypeScript-only source policy in `src/` and `test/`
- deterministic AST rules such as `single-return`, `async-await-only`, `canonical-config-import`, and file naming rules

### What `verify` does not check

`verify` does not replace the generic toolchain:

- formatting and generic lint rules stay in Biome
- type correctness stays in TypeScript
- runtime behavior stays in tests

### When to use `verify`

Use the tools together, not interchangeably:

- run Biome when you want style, formatting, and baseline lint feedback
- run TypeScript when you want type-safety feedback
- run `verify` when you want to enforce repository contract, scaffold integrity, and deterministic standards rules

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
4. Pass the generated init prompt to your LLM together with your feature brief.
5. Make the LLM execute `npm run check` itself and fix any failures before it finishes.

Minimal flow:

```bash
mkdir my-service
cd my-service
npx @sha3/code-standards init --template node-service --yes
```

What `init` generates for you:

- `AGENTS.md` as the blocking repo policy
- `ai/contract.json` as the deterministic standards contract
- `ai/<assistant>.md` adapter files when AI adapters are enabled
- `prompts/init.prompt.md` as the starter prompt for the first implementation pass
- the managed `src/`, `test/`, config, and package surface for the selected template

The CLI also prints these next steps to the console after `init` completes, so the user does not have to infer the LLM workflow manually.

Recommended LLM workflow after `init`:

1. Open `AGENTS.md`, `ai/contract.json`, and your assistant file such as `ai/codex.md`.
2. Open `prompts/init.prompt.md`.
3. Paste the contents of `prompts/init.prompt.md` into the LLM.
4. Append your task-specific brief, for example:

```txt
Task:
- Build the first HTTP endpoint for service health.
- Keep the generated scaffold structure intact.
- Add tests for the new behavior.
```

5. In your prompt, explicitly require the LLM to execute:

```bash
npm run check
```

6. Require the LLM to fix any failing checks and rerun the command until it passes.

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
6. run `npm run fix` and `npm run check`

### `refactor` step by step

Use `refactor` when you already have a repo and want to rebuild it onto the managed scaffold without losing the contracts you choose to preserve.

1. Go to the root of the existing project.
2. Run `refactor`.
3. Answer the preservation questions if you are in interactive mode.
4. Let the command generate the snapshot and rebuild the managed surface.
5. Open the generated refactor artifacts and the generated refactor prompt.
6. Pass that prompt to the LLM so it can rebuild the domain code into the fresh scaffold.
7. Require the LLM to execute `npm run check` itself and fix any failures before it finishes.

Typical command:

```bash
npx @sha3/code-standards refactor --yes
```

If you want dependencies installed as part of the run:

```bash
npx @sha3/code-standards refactor --yes --install
```

After `refactor`, these files matter most:

- `AGENTS.md`
- `ai/contract.json`
- `.code-standards/refactor-source/public-contract.json`
- `.code-standards/refactor-source/preservation.json`
- `.code-standards/refactor-source/analysis-summary.md`
- `.code-standards/refactor-source/latest/`
- `prompts/refactor.prompt.md`

The CLI also prints an explicit LLM handoff checklist after `refactor` completes, including the prompt path and the refactor artifacts that must be given to the model.

Recommended LLM workflow after `refactor`:

1. Run `refactor` and wait for it to complete.
2. Open `prompts/refactor.prompt.md` in the refactored repo.
3. Paste the full contents of `prompts/refactor.prompt.md` into the LLM.
4. Add a short execution brief underneath, for example:

```txt
Task:
- Rebuild the application behavior inside the fresh scaffold under src/ and test/.
- Preserve the public API and HTTP contracts captured in the refactor artifacts.
- Do not edit managed files unless a standards update is explicitly required.
```

5. Let the LLM implement the rewrite using:
   - `AGENTS.md`
   - `ai/contract.json`
   - `.code-standards/refactor-source/public-contract.json`
   - `.code-standards/refactor-source/preservation.json`
   - `.code-standards/refactor-source/analysis-summary.md`
   - `.code-standards/refactor-source/latest/`
6. In your prompt, explicitly require the LLM to execute:

```bash
npm run check
```

7. Require the LLM to fix any failing checks and rerun the command until it passes.

Practical rule: `refactor` prepares the repo and the context pack; the LLM then performs the actual domain rewrite using `prompts/refactor.prompt.md`.

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

`verify` has 4 useful modes:

- default text mode: human-readable errors to `stderr`
- `--report json`: structured output to `stdout`
- `--only`: execute only selected rule ids
- `--files`: limit file-oriented checks to a subset of files
- `--explain`: print documentation for one rule instead of verifying the repo

Important behavior:

- project-wide contract checks still run even when `--files` is used
- file-oriented checks such as AST source rules and TypeScript-only checks are scoped by `--files`
- `--explain` cannot be combined with `--report`, `--only`, or `--files`
- `text` remains the default output mode to preserve human-friendly local usage

### Verify Output

Example text output:

```txt
- [single-return] src/user/user.service.ts: functions and methods in src/ must use a single return statement
- [canonical-config-import] src/user/user.service.ts: config imports must use `import config from ".../config.ts"`
Verification failed with 2 issue(s).
```

Example JSON output:

```json
{
  "ok": false,
  "issues": [
    {
      "ruleId": "single-return",
      "category": "source-rule",
      "severity": "error",
      "message": "functions and methods in src/ must use a single return statement",
      "relativePath": "src/user/user.service.ts",
      "enforcedBy": "verify"
    }
  ],
  "summary": {
    "issueCount": 1,
    "checkedRuleIds": ["single-return"],
    "checkedFiles": ["src/user/user.service.ts"]
  }
}
```

Exit code behavior:

- exit code `0`: verification passed
- exit code non-zero: verification failed or arguments were invalid

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
- Biome and TypeScript pass but `verify` fails: expected, because `verify` checks product policy and contract rules that generic tooling does not cover

### Required README headings in generated projects

Keep these headings in generated projects:

- `## TL;DR`
- `## Installation`
- `## Compatibility`
- `## Public API`
- `## Integration Guide`
- `## Configuration`
- `## Scripts`
- `## Structure`
- `## Troubleshooting`
- `## AI Workflow`

### VS Code formatting conflicts

Use the `biomejs.biome` extension as the default formatter for generated projects.

## AI Workflow

Generated projects treat these files as the local AI contract:

1. `ai/contract.json`
2. `AGENTS.md`
3. `ai/<assistant>.md`

Recommended bootstrap prompt:

```txt
Before generating code:
- Read AGENTS.md, ai/contract.json, and ai/<assistant>.md.
- Summarize the blocking deterministic rules.
- Implement the task without editing managed files unless this is a standards update.
- Run npm run check and fix all failures before finishing.
```

For a standards migration on an existing repo, run `refactor` first and then use the generated files under `.code-standards/refactor-source/` as reference context for the rewrite.
