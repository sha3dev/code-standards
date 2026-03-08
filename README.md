# @sha3/code-standards

Scaffold TypeScript projects, regenerate them with `refactor`, and enforce deterministic AI-first standards locally.

## TL;DR

Create a new project:

```bash
npx @sha3/code-standards init --template node-service --yes
```

Realign an existing repo in place:

```bash
npx @sha3/code-standards refactor --yes
```

Verify deterministic rules:

```bash
npx @sha3/code-standards verify
```

## What It Does

This package combines:

1. project scaffolding for `node-lib` and `node-service`
2. shared tooling exports for Biome and TypeScript
3. generated AI contract files (`AGENTS.md`, `ai/contract.json`, optional `ai/*.md`)
4. deterministic local verification through `code-standards verify`

The current model is intentionally simple:

- `init` creates a new standard project
- `refactor` snapshots the current repo and rebuilds the managed scaffold in place
- `profile` creates or updates the AI style profile
- `verify` enforces deterministic project rules

There is no public `refresh` or `update` command anymore.

## Installation

Use it directly with `npx`:

```bash
npx @sha3/code-standards --help
```

Or install it as a dev dependency:

```bash
npm install -D @sha3/code-standards
```

## Compatibility

- Node.js 20.11+
- ESM package runtime
- TypeScript-first projects
- Biome as the base formatter and linter

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

Behavior notes:

- `init` always works in the current directory and creates a fresh scaffold.
- `refactor` always works in the current directory and never accepts a remote or local source argument.
- `refactor` stores the previous repo state under `.code-standards/refactor-source/` before rebuilding managed files.
- `verify` checks contract presence, metadata sync, README sections, template layout, TypeScript-only constraints, and AST-level source rules.

## Integration Guide

### Create a new project

```bash
mkdir my-service
cd my-service
npx @sha3/code-standards init --template node-service --yes
```

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

### Verify a project

```bash
npx @sha3/code-standards verify
```

This is the command generated projects use behind `npm run standards:check`.

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
- `lib/verify/`: AST-level deterministic rule enforcement
- `templates/`: `node-lib` and `node-service` managed scaffolds
- `prompts/`: starter prompts for `init`, `refresh`, and `refactor`
- `resources/ai/`: AI contract templates, adapters, examples, and rule catalog

## Troubleshooting

### `biome: command not found`

Install dependencies in the current workspace:

```bash
npm install
```

### `refactor` says `package.json` was not found

Run `code-standards refactor` from the root of the target project.

### `verify` fails on README sections

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
