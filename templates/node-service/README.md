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

You can override runtime configuration with a `.env` file (loaded via `dotenv`).

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## API HTTP

### `GET /`

- Response: `200 OK`
- `content-type`: `application/json`
- body: `{ "ok": true, "statusSource": "<url>" }`

## Public Module API

### `buildServer(): http.Server`

Factory for the HTTP server used by the service runtime.

Parameters:

- None.

Returns:

- `http.Server`: Node.js HTTP server with the route contract documented in `API HTTP`.

Behavior notes:

- Creates a new server instance on each call.
- Does not call `listen` by itself; startup is handled in the runtime bootstrap block.

## Integration Guide (External Projects)

1. Start the service with `npm run start`.
2. Consume the root endpoint for health/status.
3. Integrate through the HTTP contract, not through internal files.

## Configuration (`src/config.ts`)

`src/config.ts` defines defaults and allows environment overrides via `.env` and `process.env`.

- `PORT` overrides `CONFIG.DEFAULT_PORT`
- `RESPONSE_CONTENT_TYPE` overrides `CONFIG.RESPONSE_CONTENT_TYPE`
- `EXTERNAL_STATUS_URL` overrides `CONFIG.EXTERNAL_STATUS_URL`

Example `.env`:

```dotenv
PORT=8080
RESPONSE_CONTENT_TYPE=application/json
EXTERNAL_STATUS_URL=https://status.my-env.internal/health
```

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
- `src/config.ts`: centralized configuration with env overrides
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
Assistants MUST NOT edit `@sha3/code-standards` managed files (`AGENTS.md`, `ai/*`, `ai/examples/*`, tooling configs) unless explicitly requested.
