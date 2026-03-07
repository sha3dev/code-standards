# 🚀 {{packageName}}

Feature-first TypeScript service scaffolded with deterministic standards checks and a generated AI contract.

## TL;DR

```bash
npm install
npm run check
npm run start
```

## Installation

```bash
npm install
```

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## Public API

### `ServiceRuntime`

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
const server = serviceRuntime.buildServer();
```

Behavior notes:

- `ServiceRuntime.createDefault()` wires `StatusService` and `HttpServerService`.
- `buildServer()` returns a Node HTTP server without listening.
- `startServer()` binds the server to `config.DEFAULT_PORT`.

## Integration Guide

1. Run the service locally with `npm run start`.
2. Integrate through HTTP `GET /` or import `ServiceRuntime` from the package.
3. Do not import private source paths.
4. Treat this README plus the generated AI contract as the local integration boundary.

## Configuration

Configuration is centralized in `src/config.ts`.

- `config.RESPONSE_CONTENT_TYPE`: response header for the root endpoint
- `config.DEFAULT_PORT`: port used by `startServer()`
- `config.EXTERNAL_STATUS_URL`: status source embedded in the response payload

## Scripts

- `npm run standards:check`: verify deterministic project contract rules
- `npm run check`: standards + lint + format + typecheck + tests
- `npm run fix`: lint/prettier autofix
- `npm run start`: launch the service with `tsx`
- `npm run build`: compile the module output to `dist/`

## Structure

- `src/config.ts`: canonical runtime configuration
- `src/status/status.service.ts`: status payload logic
- `src/http/http-server.service.ts`: HTTP server construction
- `src/app/service-runtime.service.ts`: runtime orchestration
- `src/main.ts`: bootstrap entrypoint
- `test/service-runtime.test.ts`: behavior test

## Troubleshooting

### Port conflicts

Override `PORT` in `.env` or your shell before running `npm run start`.

### Contract failures

Run `npm run standards:check` to detect missing managed files, README sections, or structural drift from the scaffold contract.

## AI Workflow

- Read `AGENTS.md`, `ai/contract.json`, and the relevant `ai/<assistant>.md` before coding.
- Keep managed contract/tooling files read-only during feature work.
- Run `npm run check` before finalizing changes.
