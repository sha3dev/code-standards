### Error Handling (MUST)

- Throw plain `Error` by default.
- Introduce custom error types only when other code must distinguish failure kinds.
- Do not add error classes or hierarchies without a real consumer.
- Errors MUST be thrown and handled at clear application boundaries.
- Silent catch blocks are forbidden.
- Error messages MUST include actionable context.

Good example:

- `ai/examples/rules/errors-good.ts`

Bad example:

- `ai/examples/rules/errors-bad.ts`
