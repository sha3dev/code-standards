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
  const brokenTarget = path.join(tempRoot, "broken");
  const collisionTarget = path.join(tempRoot, "existing");
  const positionalTarget = path.join(tempRoot, "positional");
  const targetFlagTarget = path.join(tempRoot, "target-flag");

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

  await mkdir(libTarget, { recursive: true });
  await mkdir(serviceTarget, { recursive: true });
  await mkdir(brokenTarget, { recursive: true });
  await mkdir(positionalTarget, { recursive: true });
  await mkdir(targetFlagTarget, { recursive: true });

  result = runCli(
    ["init", "--template", "node-lib", "--yes", "--no-install", "--profile", profilePath],
    libTarget
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Project created/);
  const libGitignore = await readFile(path.join(libTarget, ".gitignore"), "utf8");
  assert.match(libGitignore, /node_modules\//);

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
  assert.match(agentsRaw, /ai\/examples\/rules\/class-first-good\.ts/);
  assert.match(agentsRaw, /ai\/examples\/rules\/constructor-good\.ts/);

  const libAiEntries = await readdir(path.join(libTarget, "ai"));
  assert(libAiEntries.includes("windsurf.md"));
  assert(libAiEntries.includes("examples"));

  const demoServiceRaw = await readFile(
    path.join(libTarget, "ai", "examples", "demo", "src", "invoices", "invoice-service.ts"),
    "utf8"
  );
  assert.match(demoServiceRaw, /@section constructor/);
  assert.match(demoServiceRaw, /\/\*\*\n \* @section imports:externals\n \*\/\n\n/);
  const demoInvoiceEntries = await readdir(
    path.join(libTarget, "ai", "examples", "demo", "src", "invoices")
  );
  assert(!demoInvoiceEntries.includes("invoice-repository.ts"));

  const asyncGoodRaw = await readFile(
    path.join(libTarget, "ai", "examples", "rules", "async-good.ts"),
    "utf8"
  );
  assert.match(asyncGoodRaw, /\/\*\*\n \* @section imports:externals\n \*\/\n\n/);
  const constructorGoodRaw = await readFile(
    path.join(libTarget, "ai", "examples", "rules", "constructor-good.ts"),
    "utf8"
  );
  assert.match(constructorGoodRaw, /@section constructor/);

  result = runCli(
    ["init", "--template", "node-service", "--yes", "--no-install", "--no-ai-adapters"],
    serviceTarget
  );

  assert.equal(result.status, 0, result.stderr);
  const serviceGitignore = await readFile(path.join(serviceTarget, ".gitignore"), "utf8");
  assert.match(serviceGitignore, /node_modules\//);

  const serviceEntries = await readdir(serviceTarget);
  assert(!serviceEntries.includes("AGENTS.md"));
  assert(!serviceEntries.includes("ai"));

  result = runCli(["init", "legacy-name", "--yes", "--no-install"], positionalTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Positional project names are not supported/);

  result = runCli(
    ["init", "--template", "node-lib", "--target", "ignored", "--yes", "--no-install"],
    targetFlagTarget
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--target is not supported/);

  await writeFile(profileInvalidPath, JSON.stringify({ version: "v1" }, null, 2), "utf8");
  result = runCli(
    ["init", "--template", "node-lib", "--yes", "--no-install", "--profile", profileInvalidPath],
    brokenTarget
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid profile/);

  await mkdir(collisionTarget, { recursive: true });
  await writeFile(path.join(collisionTarget, "keep.txt"), "existing", "utf8");

  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install"], collisionTarget);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not empty/);

  result = runCli(
    ["init", "--template", "node-lib", "--yes", "--no-install", "--force"],
    collisionTarget
  );

  assert.equal(result.status, 0, result.stderr);

  const eslintConfig = await import(path.join(repoRoot, "eslint", "base.mjs"));
  assert(Array.isArray(eslintConfig.default));

  const tsconfigFiles = await readdir(path.join(repoRoot, "tsconfig"));
  assert(tsconfigFiles.includes("node-lib.json"));

  console.log("smoke fixtures passed");
}

await main();
