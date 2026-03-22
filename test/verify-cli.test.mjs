import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");
const cliPath = path.resolve(repoRoot, "bin/code-standards.mjs");

function runVerify(args, cwd) {
  return spawnSync(process.execPath, [cliPath, "verify", ...args], {
    cwd,
    encoding: "utf8",
  });
}

async function createVerifyFixture(t) {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-verify-cli-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src", "user"), { recursive: true });
  await mkdir(path.join(targetDir, "src", "package-info"), { recursive: true });
  await mkdir(path.join(targetDir, "test"), { recursive: true });
  await mkdir(path.join(targetDir, "ai"), { recursive: true });

  const contract = {
    formatVersion: "v2",
    generatedByVersion: "0.9.0",
    project: {
      name: "demo-lib",
      template: "node-lib",
      withAiAdapters: false,
    },
    profile: {
      comment_section_blocks: [],
    },
    managedFiles: ["AGENTS.md", "ai/contract.json"],
    rules: [
      {
        id: "single-return",
        title: "Single Return",
        summary: "Functions and methods outside src/http/ must use a single return statement.",
        severity: "error",
        kind: "style",
        deterministic: true,
        verificationMode: "deterministic",
        verificationSource: "ast",
        implementedBy: ["source-rule-verifier"],
        requiresContext: "full-project",
        confidence: "high",
        appliesTo: ["src/**/*.ts", "!src/http/**/*.ts"],
        enforcedBy: ["verify"],
        examples: {
          good: ["ai/examples/rules/returns-good.ts"],
          bad: ["ai/examples/rules/returns-bad.ts"],
        },
      },
      {
        id: "canonical-config-import",
        title: "Canonical Config Import",
        summary: "Imports of config.ts must use the config identifier and include the .ts extension.",
        severity: "error",
        kind: "architecture",
        deterministic: true,
        verificationMode: "deterministic",
        verificationSource: "ast",
        implementedBy: ["source-rule-verifier"],
        requiresContext: "full-project",
        confidence: "high",
        appliesTo: ["src/**/*.ts"],
        enforcedBy: ["verify"],
        examples: {
          good: [],
          bad: [],
        },
      },
    ],
  };

  await writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo-lib",
        type: "module",
        codeStandards: {
          contractVersion: "v2",
          template: "node-lib",
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
    path.join(targetDir, "README.md"),
    [
      "# demo-lib",
      "",
      "Library for testing verify CLI output.",
      "",
      "## TL;DR",
      "",
      "## Why",
      "",
      "## Main Capabilities",
      "",
      "## Installation",
      "",
      "## Usage",
      "",
      "```ts",
      'import { readValue } from "demo-lib";',
      "",
      'console.log(readValue("ok"));',
      "```",
      "",
      "## Examples",
      "",
      "```ts",
      'import { readValue } from "demo-lib";',
      "",
      'console.log(readValue("ok"));',
      "```",
      "",
      "## Public API",
      "",
      "### `readValue`",
      "",
      "Public function used by the fixture.",
      "",
      "## Configuration",
      "",
      "## Compatibility",
      "",
      "## Scripts",
      "",
      "## Structure",
      "",
      "## Troubleshooting",
      "",
      "## AI Workflow",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "config.ts"), 'const config = { STATUS: "ok" } as const;\n\nexport default config;\n', "utf8");
  await writeFile(
    path.join(targetDir, "src", "user", "user.service.ts"),
    'import settings from "../config.ts";\n\nexport function readValue(input: string): string {\n  if (input.length === 0) {\n    return "empty";\n  }\n\n  return settings.STATUS;\n}\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "package-info", "package-info.service.ts"), "export class PackageInfoService {}\n", "utf8");
  await writeFile(path.join(targetDir, "src", "index.ts"), 'export { readValue } from "./user/user.service.ts";\n', "utf8");
  await writeFile(
    path.join(targetDir, "test", "package-info.test.ts"),
    'import test from "node:test";\n\ntest("package info placeholder", () => {});\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "test", "user.test.ts"), 'import test from "node:test";\n\ntest("placeholder", () => {});\n', "utf8");

  return targetDir;
}

test("verify --report json returns structured output", async (t) => {
  const targetDir = await createVerifyFixture(t);

  const result = runVerify(["--report", "json"], targetDir);

  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, false);
  assert.equal(report.summary.issueCount, 3);
  assert.equal(report.summary.errorCount, 3);
  assert.equal(report.summary.warningCount, 0);
  assert.equal(report.summary.auditCount, 0);
  assert(report.issues.some((issue) => issue.ruleId === "single-return"));
  assert(report.issues.some((issue) => issue.ruleId === "canonical-config-import"));
  assert(report.issues.some((issue) => issue.ruleId === "readme-config-coverage"));
});

test("verify does not fail by default when only warnings are present", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-verify-warning-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src", "package-info"), { recursive: true });
  await mkdir(path.join(targetDir, "test"), { recursive: true });
  await mkdir(path.join(targetDir, "ai"), { recursive: true });

  await writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo-lib",
        type: "module",
        codeStandards: {
          contractVersion: "v2",
          template: "node-lib",
          withAiAdapters: false,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(path.join(targetDir, "AGENTS.md"), "# Agents\n", "utf8");
  await writeFile(
    path.join(targetDir, "ai", "contract.json"),
    `${JSON.stringify(
      {
        formatVersion: "v2",
        generatedByVersion: "1.0.0",
        project: { name: "demo-lib", template: "node-lib", withAiAdapters: false },
        profile: { comment_section_blocks: [] },
        managedFiles: ["AGENTS.md", "ai/contract.json"],
        rules: [
          {
            id: "feature-first-layout",
            title: "Feature First Layout",
            summary: "Projects with feature modules must keep domain code under feature folders instead of mixing flat modules at src/ root.",
            severity: "warning",
            kind: "architecture",
            deterministic: false,
            verificationMode: "heuristic",
            verificationSource: "filesystem",
            implementedBy: ["project-layout-verifier"],
            requiresContext: "full-project",
            confidence: "medium",
            appliesTo: ["src/**/*"],
            enforcedBy: ["verify"],
            examples: { good: [], bad: [] },
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "README.md"),
    [
      "# demo-lib",
      "",
      "Library used to validate warning-only verify behavior.",
      "",
      "## TL;DR",
      "",
      "```bash",
      "npm install demo-lib",
      "```",
      "",
      "## Why",
      "",
      "Keep package info behind one public service.",
      "",
      "## Main Capabilities",
      "",
      "- reads package info",
      "",
      "## Installation",
      "",
      "```bash",
      "npm install demo-lib",
      "```",
      "",
      "## Usage",
      "",
      "```ts",
      'import { PackageInfoService } from "demo-lib";',
      "const service = PackageInfoService.createDefault();",
      "service.readPackageInfo();",
      "```",
      "",
      "## Examples",
      "",
      "```ts",
      'import { PackageInfoService } from "demo-lib";',
      "PackageInfoService.createDefault().readPackageInfo();",
      "```",
      "",
      "## Public API",
      "",
      "### `PackageInfoService`",
      "",
      "#### `createDefault()`",
      "",
      "Creates the default service.",
      "",
      "#### `readPackageInfo()`",
      "",
      "Returns package info.",
      "",
      "### `PackageInfo`",
      "",
      "Returned by `readPackageInfo()`.",
      "",
      "## Configuration",
      "",
      "- `config.PACKAGE_NAME`: package name returned by the service",
      "",
      "## Compatibility",
      "",
      "- Node.js 20+",
      "",
      "## Scripts",
      "",
      "- `npm run check`",
      "",
      "## Structure",
      "",
      "- `src/index.ts`",
      "",
      "## Troubleshooting",
      "",
      "- Run `npm run standards:check`.",
      "",
      "## AI Workflow",
      "",
      "- Read `AGENTS.md` and `ai/contract.json` before editing.",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "config.ts"), 'const config = { PACKAGE_NAME: "demo-lib" } as const;\n\nexport default config;\n', "utf8");
  await writeFile(
    path.join(targetDir, "src", "package-info", "package-info.service.ts"),
    'export type PackageInfo = { packageName: string };\n\nexport class PackageInfoService {\n  public static createDefault(): PackageInfoService {\n    return new PackageInfoService();\n  }\n\n  public readPackageInfo(): PackageInfo {\n    return { packageName: "demo-lib" };\n  }\n}\n',
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "src", "index.ts"),
    'export { PackageInfoService } from "./package-info/package-info.service.ts";\nexport type { PackageInfo } from "./package-info/package-info.service.ts";\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "package-info.ts"), 'export const unused = "warning";\n', "utf8");
  await writeFile(path.join(targetDir, "test", "package-info.test.ts"), 'import test from "node:test";\n\ntest("placeholder", () => {});\n', "utf8");

  const result = runVerify(["--report", "json"], targetDir);

  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert.equal(report.hasWarnings, true);
  assert.equal(report.summary.warningCount, 1);
  assert.equal(report.summary.errorCount, 0);
  assert(report.issues.some((issue) => issue.ruleId === "feature-first-layout"));
});

test("verify --strict fails when warnings are present", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-verify-warning-strict-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src", "package-info"), { recursive: true });
  await mkdir(path.join(targetDir, "test"), { recursive: true });
  await mkdir(path.join(targetDir, "ai"), { recursive: true });

  await writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo-lib",
        type: "module",
        codeStandards: {
          contractVersion: "v2",
          template: "node-lib",
          withAiAdapters: false,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(path.join(targetDir, "AGENTS.md"), "# Agents\n", "utf8");
  await writeFile(
    path.join(targetDir, "ai", "contract.json"),
    `${JSON.stringify(
      {
        formatVersion: "v2",
        generatedByVersion: "1.0.0",
        project: { name: "demo-lib", template: "node-lib", withAiAdapters: false },
        profile: { comment_section_blocks: [] },
        managedFiles: ["AGENTS.md", "ai/contract.json"],
        rules: [
          {
            id: "feature-first-layout",
            title: "Feature First Layout",
            summary: "Projects with feature modules must keep domain code under feature folders instead of mixing flat modules at src/ root.",
            severity: "warning",
            kind: "architecture",
            deterministic: false,
            verificationMode: "heuristic",
            verificationSource: "filesystem",
            implementedBy: ["project-layout-verifier"],
            requiresContext: "full-project",
            confidence: "medium",
            appliesTo: ["src/**/*"],
            enforcedBy: ["verify"],
            examples: { good: [], bad: [] },
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "README.md"),
    [
      "# demo-lib",
      "",
      "Library used to validate strict verify behavior.",
      "",
      "## TL;DR",
      "",
      "```bash",
      "npm install demo-lib",
      "```",
      "",
      "## Why",
      "",
      "Keep package info behind one public service.",
      "",
      "## Main Capabilities",
      "",
      "- reads package info",
      "",
      "## Installation",
      "",
      "```bash",
      "npm install demo-lib",
      "```",
      "",
      "## Usage",
      "",
      "```ts",
      'import { PackageInfoService } from "demo-lib";',
      "PackageInfoService.createDefault().readPackageInfo();",
      "```",
      "",
      "## Examples",
      "",
      "```ts",
      'import { PackageInfoService } from "demo-lib";',
      "PackageInfoService.createDefault().readPackageInfo();",
      "```",
      "",
      "## Public API",
      "",
      "### `PackageInfoService`",
      "",
      "#### `createDefault()`",
      "",
      "Creates the default service.",
      "",
      "#### `readPackageInfo()`",
      "",
      "Returns package info.",
      "",
      "### `PackageInfo`",
      "",
      "Returned by `readPackageInfo()`.",
      "",
      "## Configuration",
      "",
      "- `config.PACKAGE_NAME`: package name returned by the service",
      "",
      "## Compatibility",
      "",
      "- Node.js 20+",
      "",
      "## Scripts",
      "",
      "- `npm run check`",
      "",
      "## Structure",
      "",
      "- `src/index.ts`",
      "",
      "## Troubleshooting",
      "",
      "- Run `npm run standards:check`.",
      "",
      "## AI Workflow",
      "",
      "- Read `AGENTS.md` and `ai/contract.json` before editing.",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "config.ts"), 'const config = { PACKAGE_NAME: "demo-lib" } as const;\n\nexport default config;\n', "utf8");
  await writeFile(
    path.join(targetDir, "src", "package-info", "package-info.service.ts"),
    'export type PackageInfo = { packageName: string };\n\nexport class PackageInfoService {\n  public static createDefault(): PackageInfoService {\n    return new PackageInfoService();\n  }\n\n  public readPackageInfo(): PackageInfo {\n    return { packageName: "demo-lib" };\n  }\n}\n',
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "src", "index.ts"),
    'export { PackageInfoService } from "./package-info/package-info.service.ts";\nexport type { PackageInfo } from "./package-info/package-info.service.ts";\n',
    "utf8",
  );
  await writeFile(path.join(targetDir, "src", "package-info.ts"), 'export const unused = "warning";\n', "utf8");
  await writeFile(path.join(targetDir, "test", "package-info.test.ts"), 'import test from "node:test";\n\ntest("placeholder", () => {});\n', "utf8");

  const result = runVerify(["--report", "json", "--strict"], targetDir);

  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, false);
  assert.equal(report.summary.warningCount, 1);
  assert(report.issues.some((issue) => issue.severity === "warning"));
});

test("verify --only limits the executed rules", async (t) => {
  const targetDir = await createVerifyFixture(t);

  const result = runVerify(["--report", "json", "--only", "single-return"], targetDir);

  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.summary.checkedRuleIds, ["single-return"]);
  assert.deepEqual(
    report.issues.map((issue) => issue.ruleId),
    ["single-return"],
  );
});

test("verify --files limits source scope", async (t) => {
  const targetDir = await createVerifyFixture(t);

  const result = runVerify(["--report", "json", "--files", "src/index.ts"], targetDir);

  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert(report.summary.checkedFiles.includes("src/index.ts"));
  assert(!report.summary.checkedFiles.includes("src/user/user.service.ts"));
});

test("verify --explain prints rule documentation", () => {
  const result = runVerify(["--explain", "single-return"], repoRoot);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Rule: single-return/);
  assert.match(result.stdout, /Title: Single Return/);
  assert.match(result.stdout, /Examples:/);
});

test("verify fails for unknown rule id in --only", async (t) => {
  const targetDir = await createVerifyFixture(t);

  const result = runVerify(["--only", "does-not-exist"], targetDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown rule id for --only/);
});

test("verify fails for invalid explain combinations", async (t) => {
  const targetDir = await createVerifyFixture(t);

  const result = runVerify(["--explain", "single-return", "--report", "json"], targetDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--explain cannot be combined/);
});
