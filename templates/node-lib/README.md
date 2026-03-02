# 📚 {{packageName}}

Reusable TypeScript library with a clear integration contract for external projects and LLM agents.

## TL;DR

```bash
npm install
npm run check
npm run build
```

## Installation

```bash
npm install <library-name>
```

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## Public API

### `greet(name: string): string`

Returns a greeting using the configured prefix.

```ts
import { greet } from "<library-name>";

const greeting = greet("world");
console.log(greeting);
```

## Integration Guide (External Projects)

1. Install the library with `npm install <library-name>`.
2. Import only from the public entrypoint (`<library-name>`).
3. Do not import internal paths (`src/*`, private `dist/*` files, or private modules).
4. If you integrate with an LLM, treat this section as the integration contract.

## Configuration (`src/config.ts`)

Hardcoded configuration is centralized in `src/config.ts`.

- `CONFIG.GREETING_PREFIX`: prefix used by `greet`.

## Contract for LLM Integrators

- This README is the source of truth for external integration.
- The stable API is the one documented in `Public API`.
- If API shape or observable behavior changes, update this README in the same change.

## Scripts

- `npm run check`: lint + format check + typecheck + tests
- `npm run fix`: lint/prettier autofix
- `npm run build`: compile to `dist/`
- `npm run test`: tests with Node test runner
- `npm run publish`: publish package to npm (`--access public`)

## Structure

- `src/`: implementation
- `src/config.ts`: centralized configuration
- `test/`: tests
- `dist/`: build output

## Troubleshooting

### Import errors (ESM)

Ensure the consumer project uses Node.js-compatible ESM.

### Type errors

Run `npm run typecheck` in the consumer project and verify TypeScript version compatibility.

## AI Workflow

If you work with assistants, treat `AGENTS.md` and `ai/*.md` as blocking rules.
If existing repository code conflicts with these rules, `@sha3/code-standards` conventions MUST win and code must be refactored.
