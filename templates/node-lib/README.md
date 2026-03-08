# 📚 {{packageName}}

Feature-first TypeScript library scaffolded with an AI contract and deterministic standards checks.

## TL;DR

```bash
npm install
npm run check
npm run build
```

## Installation

```bash
npm install {{packageName}}
```

## Compatibility

- Node.js 20+
- ESM (`"type": "module"`)
- Strict TypeScript

## Public API

### `PackageInfoService`

```ts
import { PackageInfoService } from "{{packageName}}";

const packageInfoService = PackageInfoService.createDefault();
console.log(packageInfoService.readPackageInfo());
```

Behavior notes:

- `PackageInfoService.createDefault()` wires the service with `src/config.ts`.
- `readPackageInfo()` returns the configured package metadata exposed by the scaffold.

## Integration Guide

1. Install the package with `npm install {{packageName}}`.
2. Import only from the public entrypoint.
3. Do not import private source paths.
4. If another LLM consumes this library, treat this README and `AGENTS.md` as the local contract.

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
- Run `npm run check` before finalizing changes.
