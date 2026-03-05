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
- `scripts/` for local automation scripts.
- `docs/` for technical documentation.
- `ai/` for generated assistant contract files.
- `config/` for non-TypeScript configuration files (JSON/YAML/TOML) when needed.
- Root tooling config files (`eslint`, `prettier`, `tsconfig`) at project root.
- `src/config.ts` for non-parameterized hardcoded configuration values.

## Source Layout Standard

`src/` SHOULD follow a feature-first layout with shared composition boundaries:

- `src/index.ts` as the entrypoint.
- `src/app/` for composition and dependency wiring.
- `src/shared/` for cross-feature reusable modules.
- `src/<feature>/` for feature modules.
- Feature folder names SHOULD be singular (for example: `src/user`, `src/invoice`, `src/billing`).

Template-specific additions:

- `node-lib`: MAY add `src/public/` and `src/internal/` to separate stable API from private implementation.
- `node-service`: SHOULD keep transport concerns under `src/http/` (`routes`, `controllers`, `middleware`).

Within each feature folder, files SHOULD be role-oriented and explicit (`*.service.ts`, `*.repository.ts`, `*.types.ts`, `*.schema.ts`, `*.mapper.ts`), and the domain base name SHOULD be singular (`invoice.service.ts`).

## Boundary Rules

- Keep feature modules cohesive.
- Avoid cyclic dependencies.
- Keep hardcoded application configuration centralized in `src/config.ts`.
- `src/config.ts` MUST export a default object (for example `CONFIG`) and consumers MUST import it as `import CONFIG from "./config.ts"`.
