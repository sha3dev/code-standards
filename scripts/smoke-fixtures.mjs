import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cliPath = path.join(repoRoot, "bin", "code-standards.mjs");

function runCli(args, cwd = repoRoot, input) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    input,
    encoding: "utf8"
  });
}

async function main() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "sha3-standards-"));

  const profilePath = path.join(tempRoot, "profile.json");
  const profileInteractivePath = path.join(tempRoot, "profile-interactive.json");
  const profileInvalidPath = path.join(tempRoot, "profile-invalid.json");

  const libTarget = path.join(tempRoot, "demo-lib");
  const serviceTarget = path.join(tempRoot, "demo-service");
  const collisionTarget = path.join(tempRoot, "existing");

  let result = runCli(["profile", "--non-interactive", "--profile", profilePath]);
  assert.equal(result.status, 0, result.stderr);

  const profileData = JSON.parse(await readFile(profilePath, "utf8"));
  assert.equal(profileData.paradigm, "class-first");
  assert.equal(profileData.return_policy, "single_return_strict_no_exceptions");

  result = runCli(
    ["profile", "--profile", profileInteractivePath],
    repoRoot,
    "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
  );
  assert.equal(result.status, 0, result.stderr);

  const profileInteractiveData = JSON.parse(await readFile(profileInteractivePath, "utf8"));
  assert.equal(profileInteractiveData.language, "english_technical");

  result = runCli([
    "init",
    "demo-lib",
    "--template",
    "node-lib",
    "--target",
    libTarget,
    "--yes",
    "--no-install",
    "--profile",
    profilePath
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Project created/);

  const agentsRaw = await readFile(path.join(libTarget, "AGENTS.md"), "utf8");
  assert.match(agentsRaw, /Class-First Design/);
  assert.match(agentsRaw, /single `return` statement/);
  assert.match(agentsRaw, /constructor injection/);
  assert.match(agentsRaw, /feature/);
  assert.match(agentsRaw, /async\/await/);
  assert.match(agentsRaw, /imports:externals/);
  assert.match(agentsRaw, /consts/);
  assert.match(agentsRaw, /types/);
  assert.match(agentsRaw, /factory/);
  assert.match(agentsRaw, /@section/);
  assert.match(agentsRaw, /\/\/ empty/);
  assert.match(agentsRaw, /Control Flow Braces/);
  assert.match(agentsRaw, /without braces are forbidden/);
  assert.match(agentsRaw, /README Quality Standard/);
  assert.match(agentsRaw, /top-tier and production-quality/);
  assert.match(agentsRaw, /static:methods/);
  assert.match(agentsRaw, /Good example/);
  assert.match(agentsRaw, /Bad example/);

  const libAiEntries = await readdir(path.join(libTarget, "ai"));
  assert(libAiEntries.includes("windsurf.md"));

  result = runCli([
    "init",
    "demo-service",
    "--template",
    "node-service",
    "--target",
    serviceTarget,
    "--yes",
    "--no-install",
    "--no-ai-adapters"
  ]);

  assert.equal(result.status, 0, result.stderr);

  const serviceEntries = await readdir(serviceTarget);
  assert(!serviceEntries.includes("AGENTS.md"));
  assert(!serviceEntries.includes("ai"));

  await writeFile(profileInvalidPath, JSON.stringify({ version: "v1" }, null, 2), "utf8");
  result = runCli([
    "init",
    "broken",
    "--template",
    "node-lib",
    "--target",
    path.join(tempRoot, "broken"),
    "--yes",
    "--no-install",
    "--profile",
    profileInvalidPath
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid profile/);

  await mkdir(collisionTarget, { recursive: true });
  await writeFile(path.join(collisionTarget, "keep.txt"), "existing", "utf8");

  result = runCli([
    "init",
    "collision",
    "--template",
    "node-lib",
    "--target",
    collisionTarget,
    "--yes",
    "--no-install"
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not empty/);

  result = runCli([
    "init",
    "collision",
    "--template",
    "node-lib",
    "--target",
    collisionTarget,
    "--yes",
    "--no-install",
    "--force"
  ]);

  assert.equal(result.status, 0, result.stderr);

  const eslintConfig = await import(path.join(repoRoot, "eslint", "base.mjs"));
  assert(Array.isArray(eslintConfig.default));

  const tsconfigFiles = await readdir(path.join(repoRoot, "tsconfig"));
  assert(tsconfigFiles.includes("node-lib.json"));

  console.log("smoke fixtures passed");
}

await main();
