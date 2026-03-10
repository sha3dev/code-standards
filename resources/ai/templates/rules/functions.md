### Function Structure (MUST)

- Functions and methods SHOULD stay under 30 lines.
- Functions MUST implement one responsibility.
- Long functions MUST be split into private helper methods.
- In class-oriented feature files, helper logic MUST live inside the class as private or static methods rather than module-scope functions.
- If a class grows too large, split it into smaller cohesive units with explicit roles instead of keeping one oversized class file.
- Implementations MUST prefer the least complex control flow and the fewest necessary steps.
- Avoid ceremony and indirection when a direct implementation remains clear and correct.
- Simple callbacks (for example in `map`, `filter`, `reduce`, `some`, `every`, `find`, `forEach`) MUST use concise one-line arrow functions when the body is a single expression and fits within the line limit.
- For simple callback expressions, block bodies and explicit `return` MUST be avoided.
- Types MUST be preferred over interfaces for local modeling unless a public contract requires an interface.
- New implementation and test files MUST be `.ts`.
- JavaScript source files (`.js`, `.mjs`, `.cjs`) are not allowed in `src/` or `test/`.
- Feature filenames MUST be domain-specific and role-specific (for example: `invoice.service.ts`, `invoice.repository.ts`, `invoice.helpers.ts`).
- Module-level constants MUST use `SCREAMING_SNAKE_CASE`.
- Local constants (for example inside functions/methods) MUST use `camelCase`.
- Exported schema-like values MUST use `camelCase` or `PascalCase` names.
- If a declaration, expression, call, constructor call, import, object literal, or array literal fits in one line within 160 chars, it MUST stay on one line.
- If a function/method needs many inputs, define a named `<FunctionName>Options` type and pass one `options` parameter.

Good example:

- `ai/examples/rules/functions-good.ts`

Bad example:

- `ai/examples/rules/functions-bad.ts`
