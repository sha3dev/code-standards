# Style Guide

All code MUST follow the canonical rules in `standards/manifest.json`.

## Formatting

- Use Prettier for formatting.
- Use a max line length of 100.
- Use semicolons.
- Use double quotes for strings.

## TypeScript

- Use strict TypeScript mode.
- Avoid `any` unless there is no viable alternative.
- Prefer explicit return types for exported functions.
- Use type-only imports when possible.
- Always use braces in control flow (`if`, `else`, `for`, `while`, `do`).

## Naming

- Use `kebab-case` for files and directories.
- Use `PascalCase` for types and interfaces.
- Use `SCREAMING_SNAKE_CASE` for constants.

## Class File Comment Blocks

Class-oriented files MUST use `/** @section ... */` markers in this exact order:

1. `imports:externals`
2. `imports:internals`
3. `consts`
4. `types`
5. `private:attributes`
6. `private:properties`
7. `public:properties`
8. `constructor`
9. `static:properties`
10. `factory`
11. `private:methods`
12. `public:methods`
13. `static:methods`

All section blocks MUST be present even when empty. Empty sections MUST include:

```ts
// empty
```
