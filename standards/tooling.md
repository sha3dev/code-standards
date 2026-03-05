# Tooling Guide

All new projects MUST use this package and its subpath exports:

- `@sha3/code-standards/eslint/node`
- `@sha3/code-standards/eslint/test`
- `@sha3/code-standards/prettier`
- `@sha3/code-standards/tsconfig/node-lib.json` or `node-service.json`

## Behavioral Policy

In addition to tooling, each generated project MUST include profile-driven AI instructions:

- `AGENTS.md` generated from the active style profile
- `ai/codex.md`, `ai/cursor.md`, `ai/copilot.md`, `ai/windsurf.md`

The generated instructions are blocking rules and MUST be treated as the top local AI coding contract.
When generated instructions conflict with existing repository code, the generated `@sha3/code-standards` conventions MUST win.

## Enforcement

Enforcement is local and strict.

Required scripts:

- `npm run check`
- `npm run fix`
- `npm run lint`
- `npm run format:check`
- `npm run typecheck` (MUST fail on any TypeScript error)
- `npm run test`

No remote CI is required for v1.
