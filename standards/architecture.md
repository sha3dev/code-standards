# Architecture Guide

Architecture strictness is **moderate**.

## Project Templates

Two templates are supported:

- `node-lib`
- `node-service`

## Default Layout

Both templates SHOULD keep this baseline structure:

- `src/` for implementation.
- `test/` for automated tests.
- `eslint.config.mjs`, `prettier.config.cjs`, and `tsconfig.json` at root.

## Boundary Rules

- Keep feature modules cohesive.
- Avoid cyclic dependencies.
- Keep configuration centralized at project root.
