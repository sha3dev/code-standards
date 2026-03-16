### Testing and Comments (MUST)

- Add or update tests when a change introduces meaningful logic, regression risk, or critical behavior that warrants automated coverage.
- Do not create ad hoc tests for trivial, mechanical, or low-risk changes with no meaningful behavior to protect.
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
