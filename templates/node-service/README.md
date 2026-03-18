# 🚀 {{packageName}}

HTTP service package with one runtime entrypoint for composing or starting a Hono server.

## TL;DR

```bash
npm install
npm run check
npm run start
```

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
const server = serviceRuntime.buildServer();
```

## Why

Use this package when you want one small runtime surface for booting the service and one small HTTP boundary that is easy to test.
It keeps startup, route wiring, and the default response contract behind a public runtime class so callers do not need to understand the internal composition.

## Main Capabilities

- Builds the HTTP server without binding a port when tests or orchestration code need control.
- Starts the default runtime with one public method when the process should listen immediately.
- Exposes the root endpoint payload as a public type so other code can depend on the response contract.
- Keeps transport concerns small and explicit around Hono.

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run start
```

The default runtime listens on `http://localhost:3000`.

## Usage

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
const server = serviceRuntime.startServer();
```

This is the intended runtime integration path: construct the default runtime once, then either build or start the Hono-backed server depending on who owns process startup.

## Examples

Build the HTTP server without listening:

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
const server = serviceRuntime.buildServer();
```

Call the default endpoint:

```bash
curl http://localhost:3000/
```

## HTTP API

### `GET /`

Returns the default service info payload from the default Hono route.

Response shape:

```json
{
  "ok": true,
  "serviceName": "service-name"
}
```

Behavior notes:

- responds with status `200`
- returns JSON
- is implemented with `hono`
- uses the `content-type` configured in `src/config.ts`

## Public API

### `ServiceRuntime`

Primary runtime entrypoint for composing or starting the service.

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
```

#### `createDefault()`

Creates a `ServiceRuntime` with the default Hono HTTP server wiring.

Parameters:

- none

Returns:

- a ready-to-use `ServiceRuntime`

Behavior notes:

- wires the default Hono HTTP server stack
- keeps configuration centralized in `src/config.ts`

#### `buildServer()`

Builds the Hono Node server without binding a port.

Parameters:

- none

Returns:

- a Hono Node `ServerType` instance

Behavior notes:

- useful for integration tests and manual orchestration
- does not call `listen()`
- returns the exact server instance that `startServer()` would later bind

#### `startServer()`

Builds the HTTP server and starts listening on `config.DEFAULT_PORT`.

Parameters:

- none

Returns:

- the started Hono Node `ServerType` instance

Behavior notes:

- logs the listening address through the package logger
- binds immediately to the configured default port
- keeps startup behavior centralized in one public method

### `AppInfoPayload`

Public type for the default root payload returned by the root endpoint.

```ts
type AppInfoPayload = { ok: true; serviceName: string };
```

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## Configuration

Configuration is centralized in `src/config.ts`.

- `config.RESPONSE_CONTENT_TYPE`: response `content-type` header sent by the root endpoint.
- `config.DEFAULT_PORT`: port used by `startServer()` when the service binds locally.
- `config.SERVICE_NAME`: service name included in the root endpoint payload.

## Scripts

- `npm run standards:check`: verify deterministic project contract rules
- `npm run check`: standards + lint + format + typecheck + tests
- `npm run fix`: Biome autofix + format write
- `npm run start`: launch the service with `tsx`
- `npm run build`: compile the module output to `dist/`

## Structure

- `src/config.ts`: canonical runtime configuration
- `src/app-info/app-info.service.ts`: builds the root endpoint payload
- `src/http/http-server.service.ts`: constructs the Hono HTTP server
- `src/app/service-runtime.service.ts`: public runtime orchestration
- `src/main.ts`: bootstrap entrypoint
- `test/service-runtime.test.ts`: behavior test

## Troubleshooting

### Port conflicts

Override `PORT` in `.env` or your shell before running `npm run start`.

### Standards warnings

Run `npm run standards:check` to detect contract errors, README coverage gaps, and advisory warnings from the project verifier.

## AI Workflow

- Read `AGENTS.md`, `ai/contract.json`, and the relevant `ai/<assistant>.md` before coding.
- Keep managed contract/tooling files read-only during feature work.
- Keep this README focused on the runtime surface, HTTP contract, configuration, and public API.
- Rewrite examples and endpoint notes whenever exported behavior changes.
- Run `npm run check` before finalizing changes.
