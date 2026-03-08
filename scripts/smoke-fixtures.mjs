import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cliPath = path.join(repoRoot, "bin", "code-standards.mjs");

function runCli(args, cwd, input, envPatch) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: cwd ?? repoRoot,
    input,
    encoding: "utf8",
    env: envPatch ? { ...process.env, ...envPatch } : process.env,
  });
}

async function listRelativeFiles(baseDir, currentDir = baseDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listRelativeFiles(baseDir, fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}

async function main() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "sha3-standards-"));
  const profilePath = path.join(tempRoot, "profile.json");
  const profileInvalidPath = path.join(tempRoot, "profile-invalid.json");
  const fakeBinDir = path.join(tempRoot, "fake-bin");
  const fakeNpmLogPath = path.join(tempRoot, "fake-npm.log");
  const libTarget = path.join(tempRoot, "demo-lib");
  const serviceTarget = path.join(tempRoot, "demo-service");
  const collisionTarget = path.join(tempRoot, "existing");
  const brokenTarget = path.join(tempRoot, "broken");
  const installTarget = path.join(tempRoot, "install-target");
  const gitOnlyTarget = path.join(tempRoot, "git-only");
  const positionalTarget = path.join(tempRoot, "positional");
  const targetFlagTarget = path.join(tempRoot, "target-flag");

  await mkdir(fakeBinDir, { recursive: true });
  await writeFile(path.join(fakeBinDir, "npm"), '#!/bin/sh\nif [ -z "$FAKE_NPM_LOG" ]; then\n  exit 1\nfi\necho "$@" >> "$FAKE_NPM_LOG"\n', "utf8");
  await chmod(path.join(fakeBinDir, "npm"), 0o755);
  const fakeNpmEnv = { PATH: `${fakeBinDir}:${process.env.PATH}`, FAKE_NPM_LOG: fakeNpmLogPath };
  const runCliWithFakeNpm = (args, cwd, input) => runCli(args, cwd ?? repoRoot, input, fakeNpmEnv);

  let result = runCli(["profile", "--non-interactive", "--profile", profilePath]);
  assert.equal(result.status, 0, result.stderr);

  const profileData = JSON.parse(await readFile(profilePath, "utf8"));
  assert.equal(profileData.paradigm, "class-first");
  assert.equal(profileData.return_policy, "single_return_strict_no_exceptions");

  await mkdir(libTarget, { recursive: true });
  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install", "--profile", profilePath], libTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Project created/);
  assert.match(result.stdout, /Guided next steps:/);
  assert.match(result.stdout, /prompts\/init\.prompt\.md/);
  assert.match(result.stdout, /npm run check/);

  const libFiles = await listRelativeFiles(libTarget);
  assert(libFiles.includes("src/greeter/greeter.service.ts"));
  assert(libFiles.includes("test/greeter.test.ts"));
  assert(libFiles.includes("AGENTS.md"));
  assert(libFiles.includes("ai/contract.json"));
  assert(libFiles.includes("ai/codex.md"));
  assert(libFiles.includes("ai/examples/rules/returns-good.ts"));
  assert(libFiles.includes("biome.json"));
  assert(libFiles.includes(".vscode/settings.json"));
  assert(libFiles.includes(".vscode/extensions.json"));
  assert(!libFiles.includes("eslint.config.mjs"));
  assert(!libFiles.includes("prettier.config.cjs"));

  const libPackage = JSON.parse(await readFile(path.join(libTarget, "package.json"), "utf8"));
  assert.equal(libPackage.codeStandards.template, "node-lib");
  assert.equal(libPackage.codeStandards.contractVersion, "v1");
  assert.equal(libPackage.codeStandards.withAiAdapters, true);
  assert.equal(libPackage.scripts["standards:check"], "code-standards verify");

  const libAgentsRaw = await readFile(path.join(libTarget, "AGENTS.md"), "utf8");
  assert.match(libAgentsRaw, /machine-readable source of truth/);
  assert.match(libAgentsRaw, /Blocking Deterministic Rules/);
  assert.match(libAgentsRaw, /single-return/);

  const libContract = JSON.parse(await readFile(path.join(libTarget, "ai", "contract.json"), "utf8"));
  assert.equal(libContract.project.template, "node-lib");
  assert.equal(libContract.formatVersion, "v1");
  assert.equal(libContract.project.withAiAdapters, true);
  assert(libContract.managedFiles.includes("AGENTS.md"));
  assert(libContract.managedFiles.includes("ai/contract.json"));
  assert(libContract.rules.some((rule) => rule.id === "single-return"));

  const libReadmeRaw = await readFile(path.join(libTarget, "README.md"), "utf8");
  for (const heading of ["## TL;DR", "## Installation", "## Public API", "## Integration Guide", "## AI Workflow"]) {
    assert.match(libReadmeRaw, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const libGreeterRaw = await readFile(path.join(libTarget, "src", "greeter", "greeter.service.ts"), "utf8");
  assert.match(libGreeterRaw, /@section constructor/);
  assert.match(libGreeterRaw, /GreeterService/);

  result = runCli(["verify"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /standards verification passed/);

  await unlink(path.join(libTarget, "ai", "contract.json"));
  result = runCli(["verify"], libTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing ai\/contract\.json/);

  await writeFile(path.join(libTarget, "ai", "contract.json"), JSON.stringify(libContract, null, 2), "utf8");
  await writeFile(path.join(libTarget, "src", "greeter", "utils.ts"), "export const makeValue = () => 1;\n", "utf8");
  result = runCli(["verify"], libTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /feature files must include an explicit role suffix/);
  await rm(path.join(libTarget, "src", "greeter", "utils.ts"));

  await writeFile(path.join(libTarget, "AGENTS.md"), "# stale\n", "utf8");
  await writeFile(path.join(libTarget, "src", "index.ts"), "// keep me\n", "utf8");
  await writeFile(fakeNpmLogPath, "", "utf8");
  result = runCliWithFakeNpm(["refactor", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /LLM handoff steps:/);
  assert.match(result.stdout, /prompts\/refactor\.prompt\.md/);
  assert.match(result.stdout, /\.code-standards\/refactor-source\//);
  const refactoredAgents = await readFile(path.join(libTarget, "AGENTS.md"), "utf8");
  assert.doesNotMatch(refactoredAgents, /# stale/);
  const libIndexAfterRefactor = await readFile(path.join(libTarget, "src", "index.ts"), "utf8");
  assert.notEqual(libIndexAfterRefactor, "// keep me\n");
  assert.match(libIndexAfterRefactor, /GreeterService/);
  const refactorSnapshotIndex = await readFile(path.join(libTarget, ".code-standards", "refactor-source", "latest", "src", "index.ts"), "utf8");
  assert.equal(refactorSnapshotIndex, "// keep me\n");
  const publicContract = JSON.parse(await readFile(path.join(libTarget, ".code-standards", "refactor-source", "public-contract.json"), "utf8"));
  assert.equal(publicContract.template, "node-lib");
  const preservation = JSON.parse(await readFile(path.join(libTarget, ".code-standards", "refactor-source", "preservation.json"), "utf8"));
  assert.equal(preservation.publicApi, true);
  const analysisSummary = await readFile(path.join(libTarget, ".code-standards", "refactor-source", "analysis-summary.md"), "utf8");
  assert.match(analysisSummary, /Refactor Analysis Summary/);
  assert.equal(
    await readFile(path.join(libTarget, "prompts", "refactor.prompt.md"), "utf8"),
    await readFile(path.join(repoRoot, "prompts", "refactor.prompt.md"), "utf8"),
  );

  let fakeNpmLog = await readFile(fakeNpmLogPath, "utf8");
  assert.deepEqual(
    fakeNpmLog
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
    ["run fix", "run check"],
  );

  await mkdir(serviceTarget, { recursive: true });
  result = runCli(["init", "--template", "node-service", "--yes", "--no-install", "--no-ai-adapters"], serviceTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Guided next steps:/);
  assert.match(result.stdout, /prompts\/init\.prompt\.md/);

  const serviceFiles = await listRelativeFiles(serviceTarget);
  assert(serviceFiles.includes("AGENTS.md"));
  assert(serviceFiles.includes("ai/contract.json"));
  assert(!serviceFiles.includes("ai/codex.md"));
  assert(serviceFiles.includes("src/status/status.service.ts"));
  assert(serviceFiles.includes("src/http/http-server.service.ts"));
  assert(serviceFiles.includes("src/app/service-runtime.service.ts"));
  assert(serviceFiles.includes("test/service-runtime.test.ts"));
  assert(serviceFiles.includes("biome.json"));
  assert(serviceFiles.includes(".vscode/settings.json"));
  assert(serviceFiles.includes(".vscode/extensions.json"));
  assert(!serviceFiles.includes("eslint.config.mjs"));
  assert(!serviceFiles.includes("prettier.config.cjs"));

  const servicePackage = JSON.parse(await readFile(path.join(serviceTarget, "package.json"), "utf8"));
  assert.equal(servicePackage.codeStandards.withAiAdapters, false);
  assert.equal(servicePackage.scripts["standards:check"], "code-standards verify");

  const serviceContract = JSON.parse(await readFile(path.join(serviceTarget, "ai", "contract.json"), "utf8"));
  assert.equal(serviceContract.project.template, "node-service");
  assert.equal(serviceContract.project.withAiAdapters, false);
  assert(serviceContract.managedFiles.includes("AGENTS.md"));
  assert(serviceContract.managedFiles.includes("ai/contract.json"));
  assert(serviceContract.managedFiles.includes("prompts/init.prompt.md"));
  assert(serviceContract.managedFiles.includes("prompts/refactor.prompt.md"));

  result = runCli(["verify"], serviceTarget);
  assert.equal(result.status, 0, result.stderr);

  const serviceReadmeRaw = await readFile(path.join(serviceTarget, "README.md"), "utf8");
  assert.match(serviceReadmeRaw, /## Public API/);
  assert.match(serviceReadmeRaw, /## Configuration/);
  assert.match(serviceReadmeRaw, /## AI Workflow/);

  await writeFile(fakeNpmLogPath, "", "utf8");
  result = runCliWithFakeNpm(["refactor", "--install", "--no-ai-adapters", "--yes"], serviceTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(path.join(serviceTarget, ".code-standards", "refactor-source", "latest", "src", "main.ts"), "utf8"),
    await readFile(path.join(serviceTarget, "src", "main.ts"), "utf8"),
  );
  fakeNpmLog = await readFile(fakeNpmLogPath, "utf8");
  assert.deepEqual(
    fakeNpmLog
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
    ["install", "run fix", "run check"],
  );

  await mkdir(installTarget, { recursive: true });
  result = runCli(["init", "--template", "node-service", "--yes", "--no-install", "--no-ai-adapters"], installTarget);
  assert.equal(result.status, 0, result.stderr);

  await mkdir(positionalTarget, { recursive: true });
  await mkdir(targetFlagTarget, { recursive: true });
  await mkdir(path.join(gitOnlyTarget, ".git"), { recursive: true });
  await writeFile(path.join(gitOnlyTarget, ".git", "HEAD"), "ref: refs/heads/main\n", "utf8");
  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install"], gitOnlyTarget);
  assert.equal(result.status, 0, result.stderr);
  const gitOnlyEntries = await readdir(gitOnlyTarget);
  assert(gitOnlyEntries.includes(".git"));
  assert(gitOnlyEntries.includes("package.json"));

  await writeFile(profileInvalidPath, JSON.stringify({ version: "v1" }, null, 2), "utf8");
  await mkdir(brokenTarget, { recursive: true });
  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install", "--profile", profileInvalidPath], brokenTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid data at/);

  result = runCli(["init", "legacy-name", "--yes", "--no-install"], positionalTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Positional project names are not supported/);

  result = runCli(["init", "--template", "node-lib", "--target", "ignored", "--yes", "--no-install"], targetFlagTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--target is not supported/);

  await mkdir(collisionTarget, { recursive: true });
  await writeFile(path.join(collisionTarget, "keep.txt"), "existing", "utf8");
  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install"], collisionTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not empty/);

  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install", "--force"], collisionTarget);
  assert.equal(result.status, 0, result.stderr);

  console.log("smoke fixtures passed");
}

await main();
