### Testing and Comments (MUST)

- Any behavior change MUST include or update tests.
- Tests MUST validate behavior, not implementation details.
- Test files MUST be TypeScript (`*.test.ts`).
- TypeScript validation MUST pass with zero type errors.
- Any TypeScript error found by `npm run check` MUST be fixed in code; disabling strictness or adding ignore directives to bypass type errors is forbidden.
- Comments MUST be explicit and extensive when logic is non-trivial.
- Async workflows MUST use `async/await` style only.

Good example:

- `ai/examples/rules/testing-good.ts`

Bad example:

- `ai/examples/rules/testing-bad.ts`
