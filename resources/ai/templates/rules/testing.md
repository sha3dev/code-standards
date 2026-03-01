### Testing and Comments (MUST)

- Any behavior change MUST include or update tests.
- Tests MUST validate behavior, not implementation details.
- Comments MUST be explicit and extensive when logic is non-trivial.
- Async workflows MUST use `async/await` style only.

Good example:

- `ai/examples/rules/testing-good.ts`

Bad example:

- `ai/examples/rules/testing-bad.ts`
