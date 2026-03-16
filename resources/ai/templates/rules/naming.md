### Identifier Naming Policy (MUST)

- Identifiers MUST use English technical/domain terms.
- Classes MUST use `PascalCase` nouns.
- Types and interfaces MUST use `PascalCase`.
- Functions and methods MUST use `camelCase` verbs.
- Variables and properties MUST use `camelCase`.
- Boolean identifiers MUST use `is*`, `has*`, `can*`, or `should*`.
- Module-level constants MUST use `SCREAMING_SNAKE_CASE`.
- Local constants (for example inside functions/methods) MUST use `camelCase`.
- `src/config.ts` default export `config` and `src/logger.ts` default export `logger` are canonical naming exceptions.
- Exported schema-like values MUST use `camelCase` or `PascalCase`.
- Generic names are forbidden for new code (`data`, `obj`, `tmp`, `val`, `thing`, `helper`, `utils`, `common`).
