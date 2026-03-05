### Error Handling (MUST)

- Use `Error` with actionable messages by default.
- Typed/custom error classes MUST be introduced only when callers need differentiated handling (for example, boundary mapping, retries, public API contracts).
- Errors MUST be thrown and handled at clear application boundaries.
- Silent catch blocks are forbidden.
- Error messages MUST include actionable context.

Good example:

- `ai/examples/rules/errors-good.ts`

Bad example:

- `ai/examples/rules/errors-bad.ts`
