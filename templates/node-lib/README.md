# 📚 {{packageName}}

Feature-first TypeScript library scaffolded with deterministic standards, a generated AI contract, and package-grade documentation expectations.

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

- Gives you a TypeScript library scaffold with a public entrypoint, tests, and deterministic project policy.
- Keeps implementation feature-first and class-oriented without hiding behavior behind unnecessary abstractions.
- Ships with an AI contract so LLMs can extend the package while respecting local rules.

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

## Examples

Create the default service from the package root:

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
```

Read the package metadata shape:

```ts
import { PackageInfoService, type PackageInfo } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
const packageInfo: PackageInfo = packageInfoService.readPackageInfo();
```

Behavior notes:

- Import only from the package root.
- Treat `PackageInfoService` as the stable public entrypoint for the scaffolded behavior.

## Public API

### `PackageInfoService`

Default public service for reading the scaffolded package metadata.

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
```

#### `createDefault()`

Creates a `PackageInfoService` wired with `src/config.ts`.

Returns:

- a ready-to-use `PackageInfoService`

Behavior notes:

- uses the package metadata configured in `config.PACKAGE_NAME`
- keeps the default wiring at the public package boundary

#### `readPackageInfo()`

Reads the public package metadata exposed by the scaffold.

Returns:

- a `PackageInfo` object containing the configured package name

Behavior notes:

- returns a plain serializable object
- does not perform filesystem or network I/O

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

- `config.PACKAGE_NAME`: package name exposed by the default info service.

## Scripts

- `npm run standards:check`: verify deterministic project contract rules
- `npm run check`: standards + lint + format + typecheck + tests
- `npm run fix`: Biome autofix + format write
- `npm run build`: compile to `dist/`
- `npm run test`: run Node test runner with `tsx`

## Structure

- `src/config.ts`: canonical hardcoded configuration
- `src/package-info/package-info.service.ts`: neutral package info service
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
- Rewrite this README after real behavior is implemented so it documents the final public exports and methods, not just the scaffold defaults.
- Run `npm run check` before finalizing changes.
