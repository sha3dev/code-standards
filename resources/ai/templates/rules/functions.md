### Function Structure (MUST)

- Functions and methods SHOULD stay under 30 lines.
- Functions MUST implement one responsibility.
- Long functions MUST be split into private helper methods.
- Implementations MUST prefer the least complex control flow and the fewest necessary steps.
- Avoid ceremony and indirection when a direct implementation remains clear and correct.
- Simple callbacks (for example in `map`, `filter`, `reduce`, `some`, `every`, `find`, `forEach`) SHOULD use concise arrow functions.
- For simple callback expressions, block bodies and explicit `return` SHOULD be avoided.
- Types MUST be preferred over interfaces for local modeling unless a public contract requires an interface.
- New implementation and test files MUST be `.ts`.
- JavaScript source files (`.js`, `.mjs`, `.cjs`) are not allowed in `src/` or `test/`.
- Feature filenames MUST be domain-specific and role-specific (for example: `invoice.service.ts`, `invoice.repository.ts`).
- Module-level constants MUST use `SCREAMING_SNAKE_CASE`.
- Local constants (for example inside functions/methods) MUST use `camelCase`.
- Exported schema-like values MUST use `camelCase` or `PascalCase` names.
- If a declaration/expression fits in one line within 160 chars, it MUST stay on one line.
- If a function/method needs many inputs, define a named `<FunctionName>Options` type and pass one `options` parameter.

Good example:

- `ai/examples/rules/functions-good.ts`

Bad example:

- `ai/examples/rules/functions-bad.ts`
