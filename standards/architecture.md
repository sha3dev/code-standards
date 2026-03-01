# Architecture Guide

Architecture strictness is **moderate**.

## Project Templates

Two templates are supported:

- `node-lib`
- `node-service`

## Default Layout

Both templates SHOULD keep this baseline structure:

- `src/` for implementation.
- `src/config.ts` for non-parameterized hardcoded configuration values.
- `test/` for automated tests.
- Root tooling config files (`eslint`, `prettier`, `tsconfig`) at project root.

## Boundary Rules

- Keep feature modules cohesive.
- Avoid cyclic dependencies.
- Keep hardcoded application configuration centralized in `src/config.ts`.
- `src/config.ts` MUST export a default object (for example `CONFIG`) and consumers MUST import it as `import CONFIG from "./config.js"`.
