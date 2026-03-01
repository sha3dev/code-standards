# Testing Guide

Projects MUST use the Node test runner.

## Location

- Store tests under `test/`.
- Use `*.test.ts` or `*.test.js` naming.

## Commands

- `npm run test` MUST execute all automated tests.
- `npm run check` MUST include test execution.

## Assertions

- Prefer `node:assert/strict`.
- Keep tests deterministic and isolated.
