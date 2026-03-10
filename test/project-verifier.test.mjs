import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { AI_ADAPTER_FILES } from "../lib/constants.mjs";
import { verifyProject } from "../lib/verify/project-verifier.mjs";

function buildNodeLibReadme(packageName, options = {}) {
  const { includePackageInfoSection = true, includeMethodSections = true, includePackageRootImport = true } = options;
  const packageImport = includePackageRootImport
    ? `import { PackageInfoService, type PackageInfo } from "${packageName}";`
    : 'import { PackageInfoService, type PackageInfo } from "./src/index.ts";';

  return `# ${packageName}

Library for exposing package metadata through a stable public service.

## TL;DR

\`\`\`bash
npm install ${packageName}
\`\`\`

## Why

- gives consumers a stable public entrypoint

## Main Capabilities

- reads package metadata through one public service
- exposes a package-root import for consumers

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Usage

\`\`\`ts
${packageImport}

const packageInfoService = PackageInfoService.createDefault();
const packageInfo: PackageInfo = packageInfoService.readPackageInfo();
\`\`\`

## Examples

\`\`\`ts
${includePackageRootImport ? `import { PackageInfoService } from "${packageName}";` : 'import { PackageInfoService } from "./src/index.ts";'}

const packageInfoService = PackageInfoService.createDefault();
\`\`\`

## Public API

### \`PackageInfoService\`

Public service for reading package info.

${includeMethodSections ? "#### `createDefault()`\n\nCreates the default service.\n\n#### `readPackageInfo()`\n\nReturns the public package info.\n" : ""}
${includePackageInfoSection ? "### `PackageInfo`\n\nPublic type returned by `readPackageInfo()`.\n" : ""}
## Configuration

- \`config.PACKAGE_NAME\`: public package name

## Compatibility

- Node.js 20+

## Scripts

- \`npm run check\`

## Structure

- \`src/index.ts\`

## Troubleshooting

- Run \`npm run standards:check\` if the contract drifts.

## AI Workflow

- Read \`AGENTS.md\` and \`ai/contract.json\` before editing.
`;
}

function buildNodeServiceReadme(packageName, options = {}) {
  const { includeHttpSection = true } = options;

  return `# ${packageName}

Service package with a public runtime facade.

## TL;DR

\`\`\`bash
npm install
\`\`\`

## Why

- gives a stable service runtime entrypoint

## Main Capabilities

- builds the server without listening
- starts the runtime through one public entrypoint

## Installation

\`\`\`bash
npm install
\`\`\`

## Running Locally

\`\`\`bash
npm run start
\`\`\`

## Usage

\`\`\`ts
import { ServiceRuntime } from "${packageName}";

const serviceRuntime = ServiceRuntime.createDefault();
serviceRuntime.startServer();
\`\`\`

## Examples

\`\`\`ts
import { ServiceRuntime } from "${packageName}";

const serviceRuntime = ServiceRuntime.createDefault();
const server = serviceRuntime.buildServer();
\`\`\`

${includeHttpSection ? "## HTTP API\n\n### `GET /`\n\nReturns the default app info payload.\n" : ""}
## Public API

### \`ServiceRuntime\`

Public runtime facade.

#### \`createDefault()\`

Creates the default runtime.

#### \`buildServer()\`

Builds the Node HTTP server.

#### \`startServer()\`

Builds and starts the server.

### \`AppInfoPayload\`

Public payload type returned by the root endpoint.

## Configuration

- \`config.DEFAULT_PORT\`

## Compatibility

- Node.js 20+

## Scripts

- \`npm run check\`

## Structure

- \`src/index.ts\`

## Troubleshooting

- Run \`npm run standards:check\` if the contract drifts.

## AI Workflow

- Read \`AGENTS.md\` and \`ai/contract.json\` before editing.
`;
}

async function createMinimalNodeLibProject(t, withAiAdaptersInMetadata, withAiAdaptersInContract, readmeOptions = {}) {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-project-verifier-lib-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src", "package-info"), { recursive: true });
  await mkdir(path.join(targetDir, "test"), { recursive: true });
  await mkdir(path.join(targetDir, "ai"), { recursive: true });

  const contract = {
    formatVersion: "v1",
    generatedByVersion: "0.9.0",
    project: {
      name: "demo-lib",
      template: "node-lib",
      withAiAdapters: withAiAdaptersInContract,
    },
    profile: {
      comment_section_blocks: [],
    },
    managedFiles: ["AGENTS.md", "ai/contract.json"],
    rules: [],
  };

  await writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo-lib",
        type: "module",
        codeStandards: {
          contractVersion: "v1",
          template: "node-lib",
          withAiAdapters: withAiAdaptersInMetadata,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(path.join(targetDir, "AGENTS.md"), "# Agents\n", "utf8");
  await writeFile(path.join(targetDir, "ai", "contract.json"), `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  await writeFile(path.join(targetDir, "src", "config.ts"), 'const config = { PACKAGE_NAME: "demo-lib" } as const;\n\nexport default config;\n', "utf8");
  await writeFile(
    path.join(targetDir, "src", "package-info", "package-info.service.ts"),
    [
      "export type PackageInfo = { packageName: string };",
      "",
      "type PackageInfoServiceOptions = { packageName: string };",
      "",
      "export class PackageInfoService {",
      "  private readonly packageName: string;",
      "",
      "  public constructor(options: PackageInfoServiceOptions) {",
      "    this.packageName = options.packageName;",
      "  }",
      "",
      "  public static createDefault(): PackageInfoService {",
      '    return new PackageInfoService({ packageName: "demo-lib" });',
      "  }",
      "",
      "  public readPackageInfo(): PackageInfo {",
      "    return { packageName: this.packageName };",
      "  }",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "src", "index.ts"),
    'export { PackageInfoService } from "./package-info/package-info.service.ts";\nexport type { PackageInfo } from "./package-info/package-info.service.ts";\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "test", "package-info.test.ts"), 'import test from "node:test";\n\ntest("placeholder", () => {});\n', "utf8");
  await writeFile(path.join(targetDir, "README.md"), buildNodeLibReadme("demo-lib", readmeOptions), "utf8");

  if (withAiAdaptersInContract) {
    for (const adapterName of AI_ADAPTER_FILES) {
      await writeFile(path.join(targetDir, "ai", adapterName), `# ${adapterName}\n`, "utf8");
    }
  }

  return targetDir;
}

async function createMinimalNodeServiceProject(t, readmeOptions = {}) {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-project-verifier-service-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src", "app"), { recursive: true });
  await mkdir(path.join(targetDir, "src", "app-info"), { recursive: true });
  await mkdir(path.join(targetDir, "src", "http"), { recursive: true });
  await mkdir(path.join(targetDir, "test"), { recursive: true });
  await mkdir(path.join(targetDir, "ai"), { recursive: true });

  const contract = {
    formatVersion: "v1",
    generatedByVersion: "0.9.0",
    project: {
      name: "demo-service",
      template: "node-service",
      withAiAdapters: false,
    },
    profile: {
      comment_section_blocks: [],
    },
    managedFiles: ["AGENTS.md", "ai/contract.json"],
    rules: [],
  };

  await writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo-service",
        type: "module",
        codeStandards: {
          contractVersion: "v1",
          template: "node-service",
          withAiAdapters: false,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(path.join(targetDir, "AGENTS.md"), "# Agents\n", "utf8");
  await writeFile(path.join(targetDir, "ai", "contract.json"), `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(targetDir, "src", "config.ts"),
    'const config = { DEFAULT_PORT: 3000, RESPONSE_CONTENT_TYPE: "application/json" } as const;\n\nexport default config;\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "app-info", "app-info.service.ts"), "export type AppInfoPayload = { name: string };\n", "utf8");
  await writeFile(path.join(targetDir, "src", "http", "http-server.service.ts"), "export class HttpServerService {}\n", "utf8");
  await writeFile(
    path.join(targetDir, "src", "app", "service-runtime.service.ts"),
    [
      "export class ServiceRuntime {",
      "  public static createDefault(): ServiceRuntime {",
      "    return new ServiceRuntime();",
      "  }",
      "",
      "  public buildServer() {",
      "    return {};",
      "  }",
      "",
      "  public startServer() {",
      "    return this.buildServer();",
      "  }",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "src", "index.ts"),
    'export { ServiceRuntime } from "./app/service-runtime.service.ts";\nexport type { AppInfoPayload } from "./app-info/app-info.service.ts";\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "main.ts"), 'console.log("placeholder");\n', "utf8");
  await writeFile(path.join(targetDir, "test", "service-runtime.test.ts"), 'import test from "node:test";\n\ntest("placeholder", () => {});\n', "utf8");
  await writeFile(path.join(targetDir, "README.md"), buildNodeServiceReadme("demo-service", readmeOptions), "utf8");

  return targetDir;
}

test("verifyProject flags withAiAdapters metadata mismatch", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, true);

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, false);
  assert(
    result.issues.some(
      (issue) =>
        issue.ruleId === "metadata-sync" &&
        issue.message.includes("package.json.codeStandards.withAiAdapters must match ai/contract.json project.withAiAdapters"),
    ),
  );
});

test("verifyProject returns a structured passing result for a valid node-lib project", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, false);

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.summary.issueCount, 0);
  assert(result.summary.checkedRuleIds.includes("readme-public-api"));
  assert(result.summary.checkedRuleIds.includes("readme-public-methods"));
  assert(result.summary.checkedRuleIds.includes("readme-usage-examples"));
  assert(result.summary.checkedFiles.includes("README.md"));
  assert(result.summary.checkedFiles.includes("src/config.ts"));
});

test("verifyProject flags missing public export section in README", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, false, { includePackageInfoSection: false });

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, false);
  assert(result.issues.some((issue) => issue.ruleId === "readme-public-api" && issue.message.includes("PackageInfo")));
});

test("verifyProject flags missing public method documentation in README", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, false, { includeMethodSections: false });

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, false);
  assert(result.issues.some((issue) => issue.ruleId === "readme-public-methods" && issue.message.includes("PackageInfoService.createDefault()")));
  assert(result.issues.some((issue) => issue.ruleId === "readme-public-methods" && issue.message.includes("PackageInfoService.readPackageInfo()")));
});

test("verifyProject ignores private class methods for README documentation", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, false);

  await writeFile(
    path.join(targetDir, "src", "package-info", "package-info.service.ts"),
    [
      "export type PackageInfo = { packageName: string };",
      "",
      "type PackageInfoServiceOptions = { packageName: string };",
      "",
      "export class PackageInfoService {",
      "  private readonly packageName: string;",
      "",
      "  public constructor(options: PackageInfoServiceOptions) {",
      "    this.packageName = options.packageName;",
      "  }",
      "",
      "  public static createDefault(): PackageInfoService {",
      '    return new PackageInfoService({ packageName: "demo-lib" });',
      "  }",
      "",
      "  public readPackageInfo(): PackageInfo {",
      "    return this.buildPackageInfo();",
      "  }",
      "",
      "  private buildPackageInfo(): PackageInfo {",
      "    return { packageName: this.packageName };",
      "  }",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, true);
  assert(!result.issues.some((issue) => issue.ruleId === "readme-public-methods" && issue.message.includes("buildPackageInfo()")));
});

test("verifyProject flags README usage examples without package-root import", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, false, { includePackageRootImport: false });

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, false);
  assert(result.issues.some((issue) => issue.ruleId === "readme-usage-examples"));
});

test("verifyProject flags missing HTTP API documentation for node-service", async (t) => {
  const targetDir = await createMinimalNodeServiceProject(t, { includeHttpSection: false });

  const result = await verifyProject(targetDir);

  assert.equal(result.ok, false);
  assert(result.issues.some((issue) => issue.ruleId === "readme-http-api"));
});
