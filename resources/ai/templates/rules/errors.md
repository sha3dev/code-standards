### Error Handling (MUST)

- Domain/application errors MUST use explicit typed error classes.
- Errors MUST be thrown and handled at clear application boundaries.
- Error messages MUST include actionable context.

Good example:

- `ai/examples/rules/errors-good.ts`

Bad example:

- `ai/examples/rules/errors-bad.ts`
