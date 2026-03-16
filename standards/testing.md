# Testing Guide

Projects MUST use the Node test runner.

## Location

- Store tests under `test/`.
- Use `*.test.ts` naming only.

## Commands

- `npm run test` MUST execute all automated tests.
- `npm run check` MUST include test execution.

## Assertions

- Prefer `node:assert/strict`.
- Keep tests deterministic and isolated.
- Add or update tests when a change introduces meaningful logic, regression risk, or critical behavior that warrants automated coverage.
- Do not create ad hoc tests for trivial, mechanical, or low-risk changes with no meaningful behavior to protect.
