### Function Structure (MUST)

- Functions and methods SHOULD stay under 30 lines.
- Functions MUST implement one responsibility.
- Long functions MUST be split into private helper methods.
- Types MUST be preferred over interfaces for local modeling unless a public contract requires an interface.
- New implementation and test files MUST be `.ts`.
- JavaScript source files (`.js`, `.mjs`, `.cjs`) are not allowed in `src/` or `test/`.
- If a declaration/expression fits in one line within 160 chars, it MUST stay on one line.
- If a function/method needs many inputs, define a named `<FunctionName>Options` type and pass one `options` parameter.

Good example:

- `ai/examples/rules/functions-good.ts`

Bad example:

- `ai/examples/rules/functions-bad.ts`
