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

## Naming

- Use `kebab-case` for files and directories.
- Use `PascalCase` for types and interfaces.
- Use `SCREAMING_SNAKE_CASE` for constants.

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
