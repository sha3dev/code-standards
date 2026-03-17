### Function Structure (MUST)

- Functions and methods SHOULD stay under 30 lines.
- Functions MUST implement one responsibility.
- Long functions MUST be split into private helper methods.
- In class-oriented feature files, helper logic MUST live inside the class as private or static methods rather than module-scope functions.
- If a class grows too large, split it into smaller cohesive units with explicit roles instead of keeping one oversized class file.
- Implementations MUST prefer the least complex control flow and the fewest necessary steps.
- Avoid ceremony and indirection when a direct implementation remains clear and correct.
- Prefer concise arrow callbacks (for example in `map`, `filter`, `reduce`, `some`, `every`, `find`, `forEach`) when writing new code.
- Do not rewrite block-bodied callbacks that Biome already preserves solely for stylistic compactness.
- Types MUST be preferred over interfaces for local modeling unless a public contract requires an interface.
- New implementation and test files MUST be `.ts`.
- JavaScript source files (`.js`, `.mjs`, `.cjs`) are not allowed in `src/` or `test/`.
- Feature filenames MUST be domain-specific and role-specific (for example: `invoice.service.ts`, `invoice.repository.ts`, `invoice.helpers.ts`).
- Module-level constants MUST use `SCREAMING_SNAKE_CASE`.
- Local constants (for example inside functions/methods) MUST use `camelCase`.
- `src/config.ts` default export `config` and `src/logger.ts` default export `logger` are canonical naming exceptions.
- Exported schema-like values MUST use `camelCase` or `PascalCase` names.
- Let Biome decide the final line wrapping. Prefer compact code, but do not force single-line layouts that the formatter preserves as multiline.
- If a function/method needs many inputs, define a named `<FunctionName>Options` type and pass one `options` parameter.

Good example:

- `ai/examples/rules/functions-good.ts`

Bad example:

- `ai/examples/rules/functions-bad.ts`
