# Project Rules

Read this file together with `AGENTS.md` and `ai/contract.json` before making implementation changes.

## Core Rules

- Treat `ai/contract.json` as the machine-readable source of truth.
- Treat `AGENTS.md` as blocking local policy.
- Keep managed files read-only unless the user explicitly requests a standards update.
- Run `npm run check` yourself before finishing and fix any failures before you stop.

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

- If a declaration, expression, call, object literal, array literal, import, or constructor call fits on one line within the configured line limit, it MUST stay on one line.
- Prefer fewer line breaks when readability is preserved.
- Do not split code into multiple lines just because it is “safer”; only split when it no longer fits cleanly or readability would suffer.

## Simple Callbacks

- Simple callbacks in `map`, `filter`, `reduce`, `some`, `every`, `find`, and `forEach` MUST use concise arrow functions when the body is a single expression.
- Do not use block-bodied callbacks with explicit `return` for simple expressions.
- If a callback fits on one line, keep it on one line.

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

## README

- Rewrite `README.md` as package-quality integration documentation once real behavior exists.
- Document every public export from `src/index.ts`.
- If a public export is a class, document each public method with purpose, return value, and behavior notes.
- Use a structure inspired by high-quality package READMEs: short value proposition, practical examples first, exhaustive API reference after.
- Do not leave scaffold-placeholder API descriptions once implementation is real.

## Active Deterministic Rules

{{deterministicRules}}

## Active Heuristic Rules

{{heuristicRules}}

## Active Audit Rules

{{auditRules}}
