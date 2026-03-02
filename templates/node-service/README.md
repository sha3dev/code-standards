# 🚀 {{packageName}}

TypeScript service template ready for local execution and feature-based evolution.

## TL;DR

```bash
npm install
npm run check
npm run start
```

## Run

```bash
npm run start
```

The service starts on `http://localhost:3000` by default.

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## API HTTP

### `GET /`

- Response: `200 OK`
- `content-type`: `application/json`
- body: `{ "ok": true, "statusSource": "<url>" }`

## Integration Guide (External Projects)

1. Start the service with `npm run start`.
2. Consume the root endpoint for health/status.
3. Integrate through the HTTP contract, not through internal files.

## Configuration (`src/config.ts`)

Hardcoded configuration is centralized:

- `CONFIG.RESPONSE_CONTENT_TYPE`
- `CONFIG.DEFAULT_PORT`
- `CONFIG.EXTERNAL_STATUS_URL`

## Contract for LLM Integrators

- This README defines the expected HTTP contract.
- Payload/status/header changes require a README update in the same change.
- For integration, use documented endpoints and do not assume internal details.

## Scripts

- `npm run start`: start the service with `tsx`
- `npm run check`: lint + format check + typecheck + tests
- `npm run fix`: apply lint/prettier autofix
- `npm run test`: run tests with Node test runner
- `npm run publish`: publish package to npm (`--access public`)

## Editor Autoformat (VS Code)

- Autoformat on save is preconfigured in `.vscode/settings.json`.
- Install recommended extensions from `.vscode/extensions.json`.

## Structure

- `src/`: implementation
- `src/config.ts`: centralized hardcoded configuration
- `test/`: tests

## Troubleshooting

### VS Code does not format on save

1. Install workspace recommended extensions (`Prettier` and `ESLint`).
2. Reload VS Code window.
3. Run command: `ESLint: Restart ESLint Server`.
4. Uninstall/disable `rvest.vs-code-prettier-eslint` (Prettier ESLint). It is incompatible with ESLint 9 flat config.

## AI Workflow

If you work with assistants, treat `AGENTS.md` and `ai/*.md` as blocking rules.
If existing repository code conflicts with these rules, `@sha3/code-standards` conventions MUST win and code must be refactored.
