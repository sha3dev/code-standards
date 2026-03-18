# 📚 {{packageName}}

Small TypeScript library that exposes package metadata through one stable, package-root API.

## TL;DR

```bash
npm install
npm run check
npm run build
```

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
console.log(packageInfoService.readPackageInfo());
```

## Why

Use this package when other modules, diagnostics code, or adapters need the package name without reaching into private files.
It gives consumers one stable import path and keeps the metadata mapping in a single service instead of scattering string literals through the codebase.

## Main Capabilities

- Exposes package metadata through a stable package-root import.
- Keeps the configured package name behind one service instead of repeating config access in callers.
- Returns plain serializable data that is easy to log, test, or hand to HTTP or CLI adapters.

## Installation

```bash
npm install {{packageName}}
```

## Usage

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
const packageInfo = packageInfoService.readPackageInfo();

console.log(packageInfo.packageName);
```

This is the intended integration path: import from the package root, create the default service once, and reuse it anywhere you need package metadata.

## Examples

Read package metadata for logging or diagnostics:

```ts
import { PackageInfoService, type PackageInfo } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
const packageInfo: PackageInfo = packageInfoService.readPackageInfo();

console.log(`[package] ${packageInfo.packageName}`);
```

Create the default service once and reuse it across boundaries:

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
const firstRead = packageInfoService.readPackageInfo();
const secondRead = packageInfoService.readPackageInfo();
```

## Public API

### `PackageInfoService`

Primary entrypoint for reading the package metadata exposed by the library.

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
```

#### `createDefault()`

Creates a `PackageInfoService` using the package configuration.

Parameters:

- none

Returns:

- a ready-to-use `PackageInfoService`

Behavior notes:

- reads the default package name from `config.PACKAGE_NAME`
- keeps callers out of `src/config.ts`
- gives consumers a stable construction path that stays valid if the internals change

#### `readPackageInfo()`

Reads the package metadata exposed by the public API.

Parameters:

- none

Returns:

- a `PackageInfo` object containing the configured package name

Behavior notes:

- returns a plain serializable object
- performs no filesystem or network I/O
- is safe to call from application code, tests, and adapters

### `PackageInfo`

Public type that describes the shape returned by `readPackageInfo()`.

```ts
type PackageInfo = { packageName: string };
```

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## Configuration

Configuration is centralized in `src/config.ts`.

- `config.PACKAGE_NAME`: package name returned by `readPackageInfo()` and exposed to consumers of this package.

## Scripts

- `npm run standards:check`: verify deterministic project contract rules
- `npm run check`: standards + lint + format + typecheck + tests
- `npm run fix`: Biome autofix + format write
- `npm run build`: compile to `dist/`
- `npm run test`: run Node test runner with `tsx`

## Structure

- `src/config.ts`: canonical hardcoded configuration
- `src/package-info/package-info.service.ts`: implementation of the public metadata service
- `src/index.ts`: public exports
- `test/package-info.test.ts`: behavior test

## Troubleshooting

### Import errors

Ensure the consumer project supports Node.js ESM and TypeScript extension rewriting.

### Standards warnings

Run `npm run standards:check` for contract errors, README coverage problems, and advisory warnings from the project verifier.

## AI Workflow

- Read `AGENTS.md`, `ai/contract.json`, and the relevant `ai/<assistant>.md` file before coding.
- Do not edit managed contract/tooling files during normal implementation.
- Keep this README focused on consumer-facing behavior, configuration, and public API.
- Rewrite examples and API notes whenever the exported behavior changes.
- Run `npm run check` before finalizing changes.
