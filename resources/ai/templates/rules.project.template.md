# Project Rules

Read this file together with `AGENTS.md` and `ai/contract.json` before making implementation changes.

## Core Rules

- Treat `ai/contract.json` as the machine-readable source of truth.
- Treat `AGENTS.md` as blocking local policy.
- Keep managed files read-only unless the user explicitly requests a standards update.
- Run `npm run check` yourself before finishing and fix any failures before you stop.
- Fix every `error`, review every `warning`, and report every `audit` item.

## Refactor Rule

- When working from a legacy codebase or refactor snapshot, you MUST analyze the old code and rebuild a fresh implementation that matches the active standards.
- Legacy code MUST be treated as behavior/reference input, not as a structure to copy into the scaffold.
- You MUST NOT preserve legacy folders, file splits, plural feature names, helper layers, wrappers, or typed errors unless they are both standards-compliant and required by preserved contracts.
- If legacy code conflicts with the scaffold, the scaffold MUST win.

## Simplicity

- Choose the simplest correct design for the current requirement.
- Do not add speculative abstractions, helper layers, wrappers, or extension points without immediate need.
- Do not use simplicity as a reason to remove valid responsibility boundaries.

## Compactness

- Let Biome decide the final line wrapping.
- Prefer compact code when writing or refactoring, but do not force single-line objects, callbacks, or other constructs that Biome keeps multiline.
- Do not split code into multiple lines just because it is “safer”, and do not manually collapse formatter-preserved multiline layouts.
- `verify` must not be treated as authority over code layout when Biome can rewrite that layout.

## Simple Callbacks

- Prefer concise arrow callbacks in `map`, `filter`, `reduce`, `some`, `every`, `find`, and `forEach` when writing new code.
- Do not rewrite Biome-stable block-bodied callbacks solely to satisfy a style preference.

## Errors

- Throw plain `Error` by default.
- Use custom error types only when other code must distinguish failure kinds.
- Do not add error hierarchies without a real consumer.

## Type Files

- Keep small or local types close to the code that uses them.
- Create `*.types.ts` only when shared feature types are substantial enough to justify a dedicated file.

## Feature Classes

- Inside `src/<feature>/`, files MUST expose exactly one public class unless the file is `*.types.ts`.
- Do not implement feature modules as exported function collections.
- If a file exposes a public class, helper logic MUST stay inside that class as private or static methods instead of module-scope functions.
- Large classes MUST be decomposed into smaller cohesive units before they become monolithic files.

## README

- Rewrite `README.md` as package-quality integration documentation once real behavior exists.
- Document every public export from `src/index.ts`.
- If a public export is a class, document each public method with purpose, return value, and behavior notes.
- Use a structure inspired by high-quality package READMEs: short value proposition, practical examples first, exhaustive API reference after.
- Do not leave scaffold-placeholder API descriptions once implementation is real.
- Keep README focused on real package/runtime behavior. Do not narrate the scaffold outside `AI Workflow`.

## Active Deterministic Rules

{{deterministicRules}}

## Active Heuristic Rules

{{heuristicRules}}

## Active Audit Rules

{{auditRules}}
