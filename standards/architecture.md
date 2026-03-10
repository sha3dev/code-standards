# Architecture Guide

Architecture strictness is **moderate**.
Simplicity policy is **minimal pragmatic (no speculative abstractions)**.

This is not optional guidance. Simplicity is a mandatory constraint:

- choose the smallest structure that works
- do not add layers, indirection, wrappers, or extra files without present need
- do not design for hypothetical future extension points
- when in doubt, remove complexity instead of adding it
- simplicity does not justify removing valid boundaries

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
- Root tooling config files (`biome`, `tsconfig`) at project root.
- `src/config.ts` for non-parameterized hardcoded configuration values.

## Source Layout Standard

`src/` SHOULD follow a feature-first layout:

- `src/index.ts` as the entrypoint.
- `src/<feature>/` for feature modules.
- Feature folder names SHOULD be singular (for example: `src/user`, `src/invoice`, `src/billing`).

Optional shared boundaries:

- `src/app/` when composition/wiring becomes non-trivial.
- `src/shared/` when cross-feature modules actually exist.

Template-specific additions:

- `node-lib`: MAY add `src/public/` and `src/internal/` to separate stable API from private implementation.
- `node-service`: SHOULD keep transport concerns under `src/http/` (`routes`, `controllers`, `middleware`).

Within each feature folder, files SHOULD be role-oriented and explicit (`*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.mapper.ts`, `*.helpers.ts`). Use `*.types.ts` only when shared feature types are substantial enough to deserve their own file. The domain base name SHOULD be singular (`invoice.service.ts`).
Files inside `src/<feature>/` MUST expose exactly one public class unless the file is `*.types.ts`.

## Boundary Rules

- Keep feature modules cohesive.
- Avoid cyclic dependencies.
- Keep hardcoded application configuration centralized in `src/config.ts`.
- `src/config.ts` MUST export a default object named `config` and consumers MUST import it as `import config from "./config.ts"`.
- Prefer the smallest design that satisfies current requirements.
- Do not introduce extra files, layers, or abstractions unless they reduce real current complexity.
- Avoid speculative structure for future scenarios that are not implemented yet.
- If two designs are both correct, the less abstract and less indirect design MUST win.
- Respect cohesion and responsibility boundaries.
- If code already has clear, justified boundaries, keep them. Do not remove them only to make the structure look simpler.
