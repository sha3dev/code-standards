# 📚 {{packageName}}

Small TypeScript package for exposing package metadata through a stable public API.

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

Use this package when you want one obvious place to read the package metadata your application exposes to other modules.
It keeps that behavior behind a narrow public surface instead of making consumers know about internal files or configuration layout.

## Main Capabilities

- Exposes package metadata through a stable package-root import.
- Provides a default service wiring that reads from `src/config.ts`.
- Returns plain serializable data that is easy to log, test, or pass across boundaries.

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

This is the intended integration path for consumers: import from the package root, create the default service, and read the metadata you want to expose.

## Examples

Read package metadata for logging or diagnostics:

```ts
import { PackageInfoService, type PackageInfo } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
const packageInfo: PackageInfo = packageInfoService.readPackageInfo();

console.log(`[package] ${packageInfo.packageName}`);
```

Create the default service once and reuse it:

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
const firstRead = packageInfoService.readPackageInfo();
const secondRead = packageInfoService.readPackageInfo();
```

## Public API

### `PackageInfoService`

Primary entrypoint for reading the package metadata exposed by this package.

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
- gives consumers a stable way to construct the service without knowing internal wiring

#### `readPackageInfo()`

Reads the package metadata exposed by the public API.

Parameters:

- none

Returns:

- a `PackageInfo` object containing the configured package name

Behavior notes:

- returns a plain serializable object
- does not perform filesystem or network I/O
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

### Contract failures

Run `npm run standards:check` to see deterministic contract violations such as missing managed files or README sections.

## AI Workflow

- Read `AGENTS.md`, `ai/contract.json`, and the relevant `ai/<assistant>.md` file before coding.
- Do not edit managed contract/tooling files during normal implementation.
- Keep this README focused on consumer-facing behavior, configuration, and public API.
- Run `npm run check` before finalizing changes.
