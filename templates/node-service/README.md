# 🚀 {{packageName}}

Feature-first TypeScript service scaffolded with deterministic standards, a generated AI contract, and package-grade documentation expectations.

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

- Gives you a TypeScript HTTP service scaffold with runtime wiring, configuration, and tests already in place.
- Makes the public service entrypoint explicit through `ServiceRuntime`.
- Keeps service behavior aligned with deterministic standards and AI-readable local policy.

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run start
```

The default scaffold listens on `http://localhost:3000`.

## Usage

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
const server = serviceRuntime.startServer();
```

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

Returns the default application info payload.

Response shape:

```json
{
  "name": "service-name"
}
```

Behavior notes:

- responds with status `200`
- returns JSON
- uses the `content-type` configured in `src/config.ts`

## Public API

### `ServiceRuntime`

Default public runtime facade for the scaffolded service.

```ts
import { ServiceRuntime } from "{{packageName}}";

const serviceRuntime = ServiceRuntime.createDefault();
```

#### `createDefault()`

Creates a `ServiceRuntime` wired with the default `HttpServerService`.

Returns:

- a ready-to-use `ServiceRuntime`

Behavior notes:

- wires the default HTTP server stack from the scaffold
- keeps configuration centralized in `src/config.ts`

#### `buildServer()`

Builds the Node HTTP server without binding a port.

Returns:

- a Node HTTP server instance

Behavior notes:

- useful for integration tests and manual orchestration
- does not call `listen()`

#### `startServer()`

Builds the HTTP server and starts listening on `config.DEFAULT_PORT`.

Returns:

- the started Node HTTP server instance

Behavior notes:

- logs the listening address through the scaffold logger
- binds immediately to the configured default port

### `AppInfoPayload`

Public type for the default root payload returned by the scaffold.

```ts
type AppInfoPayload = { name: string };
```

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## Configuration

Configuration is centralized in `src/config.ts`.

- `config.RESPONSE_CONTENT_TYPE`: response header for the root endpoint
- `config.DEFAULT_PORT`: port used by `startServer()`
- `config.SERVICE_NAME`: service name exposed by the default root payload

## Scripts

- `npm run standards:check`: verify deterministic project contract rules
- `npm run check`: standards + lint + format + typecheck + tests
- `npm run fix`: Biome autofix + format write
- `npm run start`: launch the service with `tsx`
- `npm run build`: compile the module output to `dist/`

## Structure

- `src/config.ts`: canonical runtime configuration
- `src/app-info/app-info.service.ts`: default root payload logic
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
- Rewrite this README after real behavior is implemented so it documents the final public exports, methods, and HTTP surface instead of the scaffold defaults.
- Run `npm run check` before finalizing changes.
