# Style Guide

All code MUST follow the canonical rules in `standards/manifest.json`.

## Formatting

- Use Prettier for formatting.
- Use a max line length of 160.
- Keep lines as compact as possible: if a declaration/expression fits in one line within 160 chars, keep it on one line.
- Use semicolons.
- Use double quotes for strings.

## TypeScript

- Use strict TypeScript mode.
- Project implementation and tests MUST be TypeScript-only (`.ts`).
- JavaScript source files (`.js`, `.mjs`, `.cjs`) are not allowed in `src/` or `test/`.
- Avoid `any` unless there is no viable alternative.
- Prefer explicit return types for exported functions.
- Use type-only imports when possible.
- If a function/method needs many inputs, define a named `<FunctionName>Options` type and pass a single `options` parameter.
- Always use braces in control flow (`if`, `else`, `for`, `while`, `do`).
- `src/config.ts` MUST export a default object and it MUST always be imported as `import CONFIG from ".../config.ts"`.

## Naming

- Use English technical/domain terms for all identifiers.
- Use `kebab-case` for files and directories.
- Class names MUST be `PascalCase` nouns.
- Type and interface names MUST be `PascalCase`.
- Function and method names MUST be `camelCase` verbs.
- Variable and property names MUST be `camelCase`.
- Boolean identifiers MUST use `is*`, `has*`, `can*`, or `should*` prefixes.
- Reserve `SCREAMING_SNAKE_CASE` for class-private constants only.
- Module-level and exported constants MUST use `camelCase` (or `PascalCase` for singleton-like exports), never `SCREAMING_SNAKE_CASE`.
- Use lowercase acronyms in identifiers (`userId`, `statusUrl`, `httpServer`) except well-known compact tokens (`id`, `url`, `http`, `json`).
- Prefer explicit role-based file names:
  - `*.service.ts` for business services
  - `*.controller.ts` for transport controllers
  - `*.repository.ts` for persistence adapters
  - `*.types.ts` for feature-level types and DTOs
  - `*.schema.ts` for validation schemas
  - `*.mapper.ts` for data transformation logic
  - `*.constants.ts` for constants
- Avoid ambiguous names such as `data`, `obj`, `tmp`, `val`, `thing`, `helper`, `utils`, `common`; use domain-specific names instead.

## Class File Comment Blocks

Class-oriented files MUST use 3-line JSDoc section markers in this exact order:

```ts
/**
 * @section <block-name>
 */
```

Required block names:

1. `imports:externals`
2. `imports:internals`
3. `consts`
4. `types`
5. `private:attributes`
6. `protected:attributes`
7. `private:properties`
8. `public:properties`
9. `constructor`
10. `static:properties`
11. `factory`
12. `private:methods`
13. `protected:methods`
14. `public:methods`
15. `static:methods`

All section blocks MUST be present even when empty. Empty sections MUST include:

```ts
// empty
```
