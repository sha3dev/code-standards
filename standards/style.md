# Style Guide

All code MUST follow the canonical rules in `standards/manifest.json`.

## Formatting

- Use Biome for formatting.
- Use a max line length of 160.
- Let Biome decide the final line wrapping.
- Prefer compact code, but do not force single-line layouts for constructs that Biome intentionally preserves as multiline.
- Use semicolons.
- Use double quotes for strings.

## TypeScript

- Use strict TypeScript mode.
- Project implementation and tests MUST be TypeScript-only (`.ts`).
- JavaScript source files (`.js`, `.mjs`, `.cjs`) are not allowed in `src/` or `test/`.
- Simplicity is MANDATORY.
- Always choose the simplest correct implementation that solves the current requirement.
- Prefer fewer lines, fewer files, fewer layers, and fewer moving parts.
- Do not introduce abstractions, wrappers, helper layers, option objects, factories, interfaces, or indirection unless they are justified by a real current need.
- Avoid speculative design for possible future scenarios.
- Simplicity MUST NOT come at the cost of cohesion or clear responsibility boundaries.
- Do not remove justified modules, role-based files, or separations merely to make the structure smaller.
- Prefer concise arrow functions for simple callbacks (for example in `map`, `filter`, `reduce`, `some`, `every`, `find`, `forEach`) when writing new code and when Biome already keeps that form.
- Do not churn Biome-stable block-bodied callbacks solely to satisfy a style preference.
- Avoid `any` unless there is no viable alternative.
- Prefer explicit return types for exported functions.
- Use type-only imports when possible.
- Throw plain `Error` by default; use custom error types only when control flow depends on distinguishing them.
- If a function/method needs many inputs, define a named `<FunctionName>Options` type and pass a single `options` parameter.
- Always use braces in control flow (`if`, `else`, `for`, `while`, `do`).
- In `src/`, business/domain logic MUST be implemented with classes by default.
- Module-level exported functions in `src/` SHOULD be limited to minimal entrypoint/bootstrap wrappers.
- Inside `src/<feature>/`, files MUST expose exactly one public class unless the file is `*.types.ts`.
- If a file exposes a public class, helper logic MUST stay inside that class as private or static methods rather than module-scope functions.
- Oversized classes MUST be split into smaller cohesive units with clear roles instead of accumulating into one monolithic file.
- `src/config.ts` MUST export a default object named `config` and it MUST always be imported as `import config from ".../config.ts"`.

## Naming

- Use English technical/domain terms for all identifiers.
- Use `kebab-case` for files and directories.
- Feature folder names MUST be singular (`src/invoice`, `src/user`, `src/billing`).
- Class names MUST be `PascalCase` nouns.
- Type and interface names MUST be `PascalCase`.
- Function and method names MUST be `camelCase` verbs.
- Variable and property names MUST be `camelCase`.
- Boolean identifiers MUST use `is*`, `has*`, `can*`, or `should*` prefixes.
- Module-level constants MUST use `SCREAMING_SNAKE_CASE`.
- Local constants (for example inside functions/methods) MUST use `camelCase`.
- `src/config.ts` default export `config` and `src/logger.ts` default export `logger` are canonical naming exceptions to module-level constant naming.
- Use lowercase acronyms in identifiers (`userId`, `statusUrl`, `httpServer`) except well-known compact tokens (`id`, `url`, `http`, `json`).
- Prefer explicit role-based file names:
  - `<feature>.service.ts` for business services
  - `<feature>.controller.ts` for transport controllers
  - `<feature>.repository.ts` for persistence adapters
  - `<feature>.types.ts` for shared feature-level types and DTOs when keeping them inline would add noise
  - `<feature>.helpers.ts` for extracted feature-local helper logic when it is justified as its own cohesive unit
  - `<feature>.schema.ts` for validation schemas
  - `<feature>.mapper.ts` for data transformation logic
  - `<feature>.constants.ts` for constants
- `<feature>` SHOULD be singular.
- Do not create `*.types.ts` files for small or local types that are clearer in place.
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
5. `class`
6. `private:attributes`
7. `protected:attributes`
8. `public:properties`
9. `constructor`
10. `static:properties`
11. `factory`
12. `private:methods`
13. `protected:methods`
14. `public:methods`
15. `static:methods`

Section blocks without content MUST be omitted.
`class` MUST appear immediately before the exported class declaration and marks the start of the class body.
