import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");
const cliPath = path.join(repoRoot, "bin", "code-standards.mjs");
const realNpmPath = spawnSync("which", ["npm"], { encoding: "utf8" }).stdout.trim();

async function writeFiles(targetDir, files) {
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(targetDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents, "utf8");
  }
}

async function ensureSymlink(targetPath, sourcePath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await symlink(sourcePath, targetPath);
}

async function ensureDotenvPackage(nodeModulesDir) {
  const sourcePath = path.join(repoRoot, "node_modules", "dotenv");

  if (existsSync(sourcePath)) {
    await ensureSymlink(path.join(nodeModulesDir, "dotenv"), sourcePath);
    return;
  }

  const dotenvDir = path.join(nodeModulesDir, "dotenv");
  await mkdir(dotenvDir, { recursive: true });
  await writeFile(
    path.join(dotenvDir, "package.json"),
    `${JSON.stringify(
      {
        name: "dotenv",
        type: "module",
        exports: {
          "./config": {
            types: "./config.d.ts",
            default: "./config.js",
          },
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(path.join(dotenvDir, "config.js"), "export {};\n", "utf8");
  await writeFile(path.join(dotenvDir, "config.d.ts"), "export {};\n", "utf8");
}

async function linkWorkspaceDependencies(targetDir) {
  const nodeModulesDir = path.join(targetDir, "node_modules");
  const binDir = path.join(nodeModulesDir, ".bin");

  await mkdir(binDir, { recursive: true });

  for (const binaryName of ["biome", "tsc", "tsx"]) {
    await ensureSymlink(path.join(binDir, binaryName), path.join(repoRoot, "node_modules", ".bin", binaryName));
  }

  const codeStandardsBinPath = path.join(binDir, "code-standards");
  await writeFile(
    codeStandardsBinPath,
    `#!/bin/sh
exec "${process.execPath}" "${cliPath}" "$@"
`,
    "utf8",
  );
  await chmod(codeStandardsBinPath, 0o755);
  await ensureSymlink(path.join(nodeModulesDir, "@sha3", "code-standards"), repoRoot);
  await ensureSymlink(path.join(nodeModulesDir, "@sha3", "logger"), path.join(repoRoot, "node_modules", "@sha3", "logger"));
  await ensureSymlink(path.join(nodeModulesDir, "@biomejs"), path.join(repoRoot, "node_modules", "@biomejs"));
  await ensureSymlink(path.join(nodeModulesDir, "@types"), path.join(repoRoot, "node_modules", "@types"));
  await ensureSymlink(path.join(nodeModulesDir, "@hono"), path.join(repoRoot, "node_modules", "@hono"));
  await ensureDotenvPackage(nodeModulesDir);
  await ensureSymlink(path.join(nodeModulesDir, "hono"), path.join(repoRoot, "node_modules", "hono"));
  await ensureSymlink(path.join(nodeModulesDir, "tsx"), path.join(repoRoot, "node_modules", "tsx"));
  await ensureSymlink(path.join(nodeModulesDir, "typescript"), path.join(repoRoot, "node_modules", "typescript"));
}

async function createNpmShim(t) {
  const shimDir = await mkdtemp(path.join(os.tmpdir(), "sha3-npm-shim-"));
  t.after(async () => rm(shimDir, { recursive: true, force: true }));
  const shimPath = path.join(shimDir, "npm");
  await writeFile(
    shimPath,
    `#!/bin/sh
if [ "$1" = "view" ]; then
  echo "\\"99.99.99\\""
  exit 0
fi
exec "${realNpmPath}" "$@"
`,
    "utf8",
  );
  await chmod(shimPath, 0o755);
  return { ...process.env, PATH: `${shimDir}:${process.env.PATH ?? ""}` };
}

function runCli(args, cwd, env = process.env) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120_000,
  });
}

function runNpm(args, cwd, env = process.env) {
  return spawnSync(realNpmPath, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120_000,
  });
}

function runBiome(args, cwd, env = process.env) {
  return spawnSync(path.join(cwd, "node_modules", ".bin", "biome"), args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120_000,
  });
}

async function createWorkspace(t, prefix) {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));
  return targetDir;
}

test("init node-lib fixture passes npm run check through the real CLI", async (t) => {
  const targetDir = await createWorkspace(t, "sha3-init-lib-");
  const env = await createNpmShim(t);

  const initResult = runCli(["init", "--template", "node-lib", "--yes", "--no-install"], targetDir, env);
  assert.equal(initResult.status, 0, initResult.stderr);

  await linkWorkspaceDependencies(targetDir);

  const checkResult = runNpm(["run", "check"], targetDir, env);
  assert.equal(checkResult.status, 0, checkResult.stderr);
  const contractBiomeResult = runBiome(["check", "ai/contract.json"], targetDir, env);
  assert.equal(contractBiomeResult.status, 0, contractBiomeResult.stderr);
  const skillsRaw = await readFile(path.join(targetDir, "SKILLS.md"), "utf8");
  assert.match(skillsRaw, /init-workflow/);
  assert.match(skillsRaw, /feature-shaping/);
  assert.match(skillsRaw, /simplicity-audit/);
  assert.match(skillsRaw, /change-synchronization/);
  assert.match(skillsRaw, /test-scope-selection/);
  assert.match(skillsRaw, /http-api-conventions/);
  assert.match(skillsRaw, /refactor-workflow/);
  assert.match(skillsRaw, /readme-authoring/);
  const initSkillRaw = await readFile(path.join(targetDir, "skills", "init-workflow", "SKILL.md"), "utf8");
  assert.match(initSkillRaw, /name: init-workflow/);

  const strictVerifyResult = runCli(["verify", "--strict"], targetDir, env);
  assert.equal(strictVerifyResult.status, 0, strictVerifyResult.stderr);

  const readmeRaw = await readFile(path.join(targetDir, "README.md"), "utf8");
  assert.match(readmeRaw, /stable, package-root API/);
});

test("init node-service fixture passes npm run check through the real CLI", async (t) => {
  const targetDir = await createWorkspace(t, "sha3-init-service-");
  const env = await createNpmShim(t);

  const initResult = runCli(["init", "--template", "node-service", "--yes", "--no-install"], targetDir, env);
  assert.equal(initResult.status, 0, initResult.stderr);

  await linkWorkspaceDependencies(targetDir);

  const checkResult = runNpm(["run", "check"], targetDir, env);
  assert.equal(checkResult.status, 0, checkResult.stderr);
  const contractBiomeResult = runBiome(["check", "ai/contract.json"], targetDir, env);
  assert.equal(contractBiomeResult.status, 0, contractBiomeResult.stderr);
  const skillsRaw = await readFile(path.join(targetDir, "SKILLS.md"), "utf8");
  assert.match(skillsRaw, /init-workflow/);
  assert.match(skillsRaw, /feature-shaping/);
  assert.match(skillsRaw, /simplicity-audit/);
  assert.match(skillsRaw, /change-synchronization/);
  assert.match(skillsRaw, /test-scope-selection/);
  assert.match(skillsRaw, /http-api-conventions/);
  assert.match(skillsRaw, /refactor-workflow/);
  assert.match(skillsRaw, /readme-authoring/);
  const httpApiSkillRaw = await readFile(path.join(targetDir, "skills", "http-api-conventions", "SKILL.md"), "utf8");
  assert.match(httpApiSkillRaw, /name: http-api-conventions/);
  assert.match(httpApiSkillRaw, /GET \/api\/users/);

  const strictVerifyResult = runCli(["verify", "--strict"], targetDir, env);
  assert.equal(strictVerifyResult.status, 0, strictVerifyResult.stderr);

  const readmeRaw = await readFile(path.join(targetDir, "README.md"), "utf8");
  assert.match(readmeRaw, /one runtime entrypoint/);
});

test("refactor handles a small flat repo and produces a passing node-lib scaffold", async (t) => {
  const targetDir = await createWorkspace(t, "sha3-refactor-flat-");
  const env = await createNpmShim(t);

  await writeFiles(targetDir, {
    "package.json": `${JSON.stringify({ name: "demo-lib", type: "module" }, null, 2)}\n`,
    "README.md": "# demo-lib\n\nOld README.\n",
    "src/index.ts": 'export function readValue(): string {\n  return "ok";\n}\n',
  });
  await linkWorkspaceDependencies(targetDir);

  const refactorResult = runCli(["refactor", "--template", "node-lib", "--yes"], targetDir, env);
  assert.equal(refactorResult.status, 0, refactorResult.stderr);

  const checkResult = runNpm(["run", "check"], targetDir, env);
  assert.equal(checkResult.status, 0, checkResult.stderr);
  const contractBiomeResult = runBiome(["check", "ai/contract.json"], targetDir, env);
  assert.equal(contractBiomeResult.status, 0, contractBiomeResult.stderr);
  const refactorSkillRaw = await readFile(path.join(targetDir, "skills", "refactor-workflow", "SKILL.md"), "utf8");
  assert.match(refactorSkillRaw, /^---$/m);
  assert.match(refactorSkillRaw, /name: refactor-workflow/);

  const snapshotRaw = await readFile(path.join(targetDir, ".code-standards", "refactor-source", "latest", "src", "index.ts"), "utf8");
  assert.match(snapshotRaw, /readValue/);
});

test("refactor snapshots plural folders and ambiguous names before rebuilding the scaffold", async (t) => {
  const targetDir = await createWorkspace(t, "sha3-refactor-plural-");
  const env = await createNpmShim(t);

  await writeFiles(targetDir, {
    "package.json": `${JSON.stringify({ name: "demo-lib", type: "module" }, null, 2)}\n`,
    "README.md": "# demo-lib\n\nLegacy README.\n",
    "src/users/users.service.ts": "export class UsersService {}\n",
    "src/users/helper.ts": "export class Helper {}\n",
    "src/index.ts": 'export { UsersService } from "./users/users.service.ts";\n',
  });
  await linkWorkspaceDependencies(targetDir);

  const refactorResult = runCli(["refactor", "--template", "node-lib", "--yes"], targetDir, env);
  assert.equal(refactorResult.status, 0, refactorResult.stderr);

  const checkResult = runNpm(["run", "check"], targetDir, env);
  assert.equal(checkResult.status, 0, checkResult.stderr);

  const snapshotRaw = await readFile(path.join(targetDir, ".code-standards", "refactor-source", "latest", "src", "users", "users.service.ts"), "utf8");
  assert.match(snapshotRaw, /UsersService/);
});

test("refactor snapshots unused typed errors before rebuilding the scaffold", async (t) => {
  const targetDir = await createWorkspace(t, "sha3-refactor-errors-");
  const env = await createNpmShim(t);

  await writeFiles(targetDir, {
    "package.json": `${JSON.stringify({ name: "demo-lib", type: "module" }, null, 2)}\n`,
    "README.md": "# demo-lib\n\nLegacy README.\n",
    "src/invoice/invoice.errors.ts": "export class InvoiceError extends Error {}\n",
    "src/index.ts": 'export { InvoiceError } from "./invoice/invoice.errors.ts";\n',
  });
  await linkWorkspaceDependencies(targetDir);

  const refactorResult = runCli(["refactor", "--template", "node-lib", "--yes"], targetDir, env);
  assert.equal(refactorResult.status, 0, refactorResult.stderr);

  const checkResult = runNpm(["run", "check"], targetDir, env);
  assert.equal(checkResult.status, 0, checkResult.stderr);

  const snapshotRaw = await readFile(path.join(targetDir, ".code-standards", "refactor-source", "latest", "src", "invoice", "invoice.errors.ts"), "utf8");
  assert.match(snapshotRaw, /InvoiceError/);
});

test("refactor replaces a weak README with package-grade documentation", async (t) => {
  const targetDir = await createWorkspace(t, "sha3-refactor-readme-");
  const env = await createNpmShim(t);

  await writeFiles(targetDir, {
    "package.json": `${JSON.stringify({ name: "demo-lib", type: "module" }, null, 2)}\n`,
    "README.md": "# demo-lib\n\nTODO: explain this later.\n",
    "src/index.ts": 'export function readValue(): string {\n  return "ok";\n}\n',
  });
  await linkWorkspaceDependencies(targetDir);

  const refactorResult = runCli(["refactor", "--template", "node-lib", "--yes"], targetDir, env);
  assert.equal(refactorResult.status, 0, refactorResult.stderr);

  const checkResult = runNpm(["run", "check"], targetDir, env);
  assert.equal(checkResult.status, 0, checkResult.stderr);

  const readmeRaw = await readFile(path.join(targetDir, "README.md"), "utf8");
  const snapshotReadmeRaw = await readFile(path.join(targetDir, ".code-standards", "refactor-source", "latest", "README.md"), "utf8");

  assert.match(snapshotReadmeRaw, /TODO: explain this later/);
  assert.match(readmeRaw, /PackageInfoService/);
  assert.doesNotMatch(readmeRaw, /\bTODO\b/i);
});
