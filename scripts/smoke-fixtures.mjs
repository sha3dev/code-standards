import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cliPath = path.join(repoRoot, "bin", "code-standards.mjs");

function runCli(args, cwd = repoRoot, input, envPatch) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, input, encoding: "utf8", env: envPatch ? { ...process.env, ...envPatch } : process.env });
}

async function listRelativeFiles(baseDir, currentDir = baseDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await listRelativeFiles(baseDir, fullPath);
      files.push(...nestedFiles);
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
  const profileInteractivePath = path.join(tempRoot, "profile-interactive.json");
  const profileInvalidPath = path.join(tempRoot, "profile-invalid.json");

  const libTarget = path.join(tempRoot, "demo-lib");
  const serviceTarget = path.join(tempRoot, "demo-service");
  const brokenTarget = path.join(tempRoot, "broken");
  const collisionTarget = path.join(tempRoot, "existing");
  const gitOnlyTarget = path.join(tempRoot, "git-only");
  const positionalTarget = path.join(tempRoot, "positional");
  const targetFlagTarget = path.join(tempRoot, "target-flag");
  const legacyTarget = path.join(tempRoot, "legacy");
  const installTarget = path.join(tempRoot, "install-target");
  const configuredTarget = path.join(tempRoot, "configured-target");
  const fakeBinDir = path.join(tempRoot, "fake-bin");
  const fakeNpmLogPath = path.join(tempRoot, "fake-npm.log");

  let result = runCli(["profile", "--non-interactive", "--profile", profilePath]);
  assert.equal(result.status, 0, result.stderr);

  const profileData = JSON.parse(await readFile(profilePath, "utf8"));
  assert.equal(profileData.paradigm, "class-first");
  assert.equal(profileData.return_policy, "single_return_strict_no_exceptions");

  result = runCli(["profile", "--profile", profileInteractivePath], repoRoot, "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
  assert.equal(result.status, 0, result.stderr);

  const profileInteractiveData = JSON.parse(await readFile(profileInteractivePath, "utf8"));
  assert.equal(profileInteractiveData.language, "english_technical");

  await mkdir(libTarget, { recursive: true });
  await mkdir(serviceTarget, { recursive: true });
  await mkdir(brokenTarget, { recursive: true });
  await mkdir(path.join(gitOnlyTarget, ".git"), { recursive: true });
  await mkdir(positionalTarget, { recursive: true });
  await mkdir(targetFlagTarget, { recursive: true });
  await mkdir(legacyTarget, { recursive: true });
  await mkdir(installTarget, { recursive: true });
  await mkdir(configuredTarget, { recursive: true });
  await mkdir(fakeBinDir, { recursive: true });
  await writeFile(path.join(gitOnlyTarget, ".git", "HEAD"), "ref: refs/heads/main\n", "utf8");
  await writeFile(path.join(fakeBinDir, "npm"), '#!/bin/sh\nif [ -z "$FAKE_NPM_LOG" ]; then\n  exit 1\nfi\necho "$@" >> "$FAKE_NPM_LOG"\n', "utf8");
  await chmod(path.join(fakeBinDir, "npm"), 0o755);
  const fakeNpmEnv = { PATH: `${fakeBinDir}:${process.env.PATH}`, FAKE_NPM_LOG: fakeNpmLogPath };
  const runCliWithFakeNpm = (args, cwd = repoRoot, input) => runCli(args, cwd, input, fakeNpmEnv);

  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install", "--profile", profilePath], libTarget);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Project created/);
  const libGitignore = await readFile(path.join(libTarget, ".gitignore"), "utf8");
  assert.match(libGitignore, /node_modules\//);
  const libPrettierConfigRaw = await readFile(path.join(libTarget, "prettier.config.cjs"), "utf8");
  assert.match(libPrettierConfigRaw, /printWidth: 160/);
  assert.match(libPrettierConfigRaw, /objectWrap: "collapse"/);
  const libReadmeRaw = await readFile(path.join(libTarget, "README.md"), "utf8");
  assert.match(libReadmeRaw, /# 📚 demo-lib/);
  assert.match(libReadmeRaw, /## Public API/);
  assert.match(libReadmeRaw, /## Integration Guide \(External Projects\)/);
  assert.match(libReadmeRaw, /## Contract for LLM Integrators/);
  const libConfigRaw = await readFile(path.join(libTarget, "src", "config.ts"), "utf8");
  assert.match(libConfigRaw, /GREETING_PREFIX/);
  assert.match(libConfigRaw, /const CONFIG = \{/);
  assert.match(libConfigRaw, /export default CONFIG/);
  const libIndexRaw = await readFile(path.join(libTarget, "src", "index.ts"), "utf8");
  assert.match(libIndexRaw, /import CONFIG from "\.\/config\.ts";/);
  const libTsconfigRaw = await readFile(path.join(libTarget, "tsconfig.json"), "utf8");
  assert.match(libTsconfigRaw, /"rootDir": "\."/);
  assert.match(libTsconfigRaw, /"allowImportingTsExtensions": true/);
  assert.match(libTsconfigRaw, /"rewriteRelativeImportExtensions": true/);
  const libPackageAfterInit = JSON.parse(await readFile(path.join(libTarget, "package.json"), "utf8"));
  assert.equal(libPackageAfterInit.codeStandards.template, "node-lib");
  assert.equal(libPackageAfterInit.codeStandards.withAiAdapters, true);
  assert.equal(libPackageAfterInit.codeStandards.profilePath, null);
  assert.match(libPackageAfterInit.codeStandards.lastRefreshWith, /\d+\.\d+\.\d+/);
  assert.equal(libPackageAfterInit.scripts.publish, "node scripts/release-publish.mjs");
  const libPublishScriptRaw = await readFile(path.join(libTarget, "scripts", "release-publish.mjs"), "utf8");
  assert.match(libPublishScriptRaw, /versionExistsOnNpm/);
  assert.equal(libPackageAfterInit.name, "demo-lib");
  assert.equal(libPackageAfterInit.repository.type, "git");
  assert.match(libPackageAfterInit.repository.url, /github\.com/);
  const libVscodeSettingsRaw = await readFile(path.join(libTarget, ".vscode", "settings.json"), "utf8");
  assert.match(libVscodeSettingsRaw, /"editor\.formatOnSave": true/);
  assert.match(libVscodeSettingsRaw, /"source\.fixAll\.eslint"/);
  const libVscodeExtensionsRaw = await readFile(path.join(libTarget, ".vscode", "extensions.json"), "utf8");
  assert.match(libVscodeExtensionsRaw, /esbenp\.prettier-vscode/);
  assert.match(libVscodeExtensionsRaw, /dbaeumer\.vscode-eslint/);
  assert.match(libVscodeExtensionsRaw, /rvest\.vs-code-prettier-eslint/);

  const agentsRaw = await readFile(path.join(libTarget, "AGENTS.md"), "utf8");
  assert.match(agentsRaw, /Class-First Design/);
  assert.match(agentsRaw, /single `return` statement/);
  assert.match(agentsRaw, /constructor injection/);
  assert.match(agentsRaw, /feature/);
  assert.match(agentsRaw, /async\/await/);
  assert.match(agentsRaw, /imports:externals/);
  assert.match(agentsRaw, /consts/);
  assert.match(agentsRaw, /types/);
  assert.match(agentsRaw, /protected:attributes/);
  assert.match(agentsRaw, /factory/);
  assert.match(agentsRaw, /protected:methods/);
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
  assert.match(agentsRaw, /no grandfathered style exceptions/i);

  const libAiEntries = await readdir(path.join(libTarget, "ai"));
  assert(libAiEntries.includes("windsurf.md"));
  assert(libAiEntries.includes("examples"));
  const codexAdapterRaw = await readFile(path.join(libTarget, "ai", "codex.md"), "utf8");
  assert.match(codexAdapterRaw, /conventions MUST win/);
  const libProjectFiles = await listRelativeFiles(libTarget);
  const libForbiddenJs = libProjectFiles.filter((filePath) => {
    return (
      (filePath.startsWith("src/") || filePath.startsWith("test/")) && (filePath.endsWith(".js") || filePath.endsWith(".mjs") || filePath.endsWith(".cjs"))
    );
  });
  assert.equal(libForbiddenJs.length, 0, `unexpected JS files in lib scaffold: ${libForbiddenJs}`);

  const demoServiceRaw = await readFile(path.join(libTarget, "ai", "examples", "demo", "src", "invoices", "invoice-service.ts"), "utf8");
  assert.match(demoServiceRaw, /@section constructor/);
  assert.match(demoServiceRaw, /\/\*\*\n \* @section imports:externals\n \*\/\n\n/);
  assert.match(demoServiceRaw, /import CONFIG from "\.\.\/config\.ts";/);
  const demoInvoiceEntries = await readdir(path.join(libTarget, "ai", "examples", "demo", "src", "invoices"));
  assert(!demoInvoiceEntries.includes("invoice-repository.ts"));
  const demoConfigRaw = await readFile(path.join(libTarget, "ai", "examples", "demo", "src", "config.ts"), "utf8");
  assert.match(demoConfigRaw, /STATUS_SERVICE_URL/);
  assert.match(demoConfigRaw, /const CONFIG = \{/);
  assert.match(demoConfigRaw, /export default CONFIG/);
  const demoBillingRaw = await readFile(path.join(libTarget, "ai", "examples", "demo", "src", "billing", "billing-service.ts"), "utf8");
  assert.match(demoBillingRaw, /import CONFIG from "\.\.\/config\.ts";/);

  const asyncGoodRaw = await readFile(path.join(libTarget, "ai", "examples", "rules", "async-good.ts"), "utf8");
  assert.match(asyncGoodRaw, /\/\*\*\n \* @section imports:externals\n \*\/\n\n/);
  const constructorGoodRaw = await readFile(path.join(libTarget, "ai", "examples", "rules", "constructor-good.ts"), "utf8");
  assert.match(constructorGoodRaw, /@section constructor/);

  await writeFile(path.join(libTarget, "AGENTS.md"), "# temporary marker\n", "utf8");
  await writeFile(path.join(libTarget, "ai", "examples", "rules", "async-good.ts"), "// temporary marker\n", "utf8");
  await writeFile(path.join(libTarget, ".vscode", "settings.json"), '{ "editor.formatOnSave": false }\n', "utf8");
  result = runCliWithFakeNpm(["refresh", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Project refreshed/);
  assert.match(result.stdout, /LLM prompt \(copy\/paste\):/);
  assert.match(result.stdout, /re-read AGENTS\.md and ai\/<assistant>\.md/);
  const refreshedAgentsRaw = await readFile(path.join(libTarget, "AGENTS.md"), "utf8");
  assert.doesNotMatch(refreshedAgentsRaw, /temporary marker/);
  const refreshedAsyncGoodRaw = await readFile(path.join(libTarget, "ai", "examples", "rules", "async-good.ts"), "utf8");
  assert.doesNotMatch(refreshedAsyncGoodRaw, /temporary marker/);
  const refreshedVscodeSettingsRaw = await readFile(path.join(libTarget, ".vscode", "settings.json"), "utf8");
  assert.match(refreshedVscodeSettingsRaw, /"editor\.formatOnSave": true/);

  await writeFile(path.join(libTarget, "src", "index.ts"), "// overwritten marker\n", "utf8");
  result = runCliWithFakeNpm(["refresh", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  const refreshedLibIndex = await readFile(path.join(libTarget, "src", "index.ts"), "utf8");
  assert.equal(refreshedLibIndex, "// overwritten marker\n");

  const libPackagePath = path.join(libTarget, "package.json");
  const libPackageBeforeMergeRefresh = JSON.parse(await readFile(libPackagePath, "utf8"));
  libPackageBeforeMergeRefresh.scripts.lint = "echo lint-custom";
  libPackageBeforeMergeRefresh.scripts.custom = "echo custom";
  libPackageBeforeMergeRefresh.devDependencies.eslint = "0.0.1";
  libPackageBeforeMergeRefresh.devDependencies.customdep = "1.2.3";
  libPackageBeforeMergeRefresh.customField = { keep: true };
  await writeFile(libPackagePath, `${JSON.stringify(libPackageBeforeMergeRefresh, null, 2)}\n`, "utf8");

  result = runCliWithFakeNpm(["refresh", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  const libPackageAfterMergeRefresh = JSON.parse(await readFile(libPackagePath, "utf8"));
  assert.equal(libPackageAfterMergeRefresh.scripts.lint, "eslint .");
  assert.equal(libPackageAfterMergeRefresh.scripts.custom, "echo custom");
  assert.equal(libPackageAfterMergeRefresh.devDependencies.eslint, "^9.20.1");
  assert.equal(libPackageAfterMergeRefresh.devDependencies.customdep, "1.2.3");
  assert.equal(libPackageAfterMergeRefresh.customField.keep, true);
  assert.equal(libPackageAfterMergeRefresh.name, libPackageBeforeMergeRefresh.name);
  assert.equal(libPackageAfterMergeRefresh.version, libPackageBeforeMergeRefresh.version);
  assert.equal(libPackageAfterMergeRefresh.private, libPackageBeforeMergeRefresh.private);
  assert.equal(libPackageAfterMergeRefresh.main, "dist/index.js");
  assert.equal(libPackageAfterMergeRefresh.types, "dist/index.d.ts");
  assert.deepEqual(libPackageAfterMergeRefresh.files, ["dist"]);

  const libPackageWithoutMetadata = { ...libPackageAfterMergeRefresh };
  delete libPackageWithoutMetadata.codeStandards;
  await writeFile(libPackagePath, `${JSON.stringify(libPackageWithoutMetadata, null, 2)}\n`, "utf8");
  result = runCliWithFakeNpm(["refresh", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  const libPackageAfterMetadataRecovery = JSON.parse(await readFile(libPackagePath, "utf8"));
  assert.equal(libPackageAfterMetadataRecovery.codeStandards.template, "node-lib");

  await writeFile(path.join(libTarget, "AGENTS.md"), "# keep me\n", "utf8");
  result = runCliWithFakeNpm(["refresh", "--no-ai-adapters", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /re-read package\.json, eslint\.config\.mjs, prettier\.config\.cjs, and tsconfig\.json/);
  const agentsAfterNoAi = await readFile(path.join(libTarget, "AGENTS.md"), "utf8");
  assert.equal(agentsAfterNoAi, "# keep me\n");
  const packageAfterNoAiRefresh = JSON.parse(await readFile(libPackagePath, "utf8"));
  assert.equal(packageAfterNoAiRefresh.codeStandards.withAiAdapters, false);

  await writeFile(path.join(libTarget, "src", "config.ts"), "// dry-run marker\n", "utf8");
  result = runCliWithFakeNpm(["refresh", "--dry-run", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Dry run: refresh would update/);
  const configAfterDryRun = await readFile(path.join(libTarget, "src", "config.ts"), "utf8");
  assert.equal(configAfterDryRun, "// dry-run marker\n");

  await writeFile(path.join(libTarget, "src", "index.ts"), "// alias marker\n", "utf8");
  result = runCliWithFakeNpm(["update", "--yes"], libTarget);
  assert.equal(result.status, 0, result.stderr);
  const indexAfterUpdateAlias = await readFile(path.join(libTarget, "src", "index.ts"), "utf8");
  assert.equal(indexAfterUpdateAlias, "// alias marker\n");

  result = runCli(["init", "--template", "node-service", "--yes", "--no-install", "--no-ai-adapters"], serviceTarget);

  assert.equal(result.status, 0, result.stderr);
  const serviceGitignore = await readFile(path.join(serviceTarget, ".gitignore"), "utf8");
  assert.match(serviceGitignore, /node_modules\//);
  const servicePrettierConfigRaw = await readFile(path.join(serviceTarget, "prettier.config.cjs"), "utf8");
  assert.match(servicePrettierConfigRaw, /printWidth: 160/);
  assert.match(servicePrettierConfigRaw, /objectWrap: "collapse"/);
  const serviceReadmeRaw = await readFile(path.join(serviceTarget, "README.md"), "utf8");
  assert.match(serviceReadmeRaw, /# 🚀 demo-service/);
  assert.match(serviceReadmeRaw, /## API HTTP/);
  assert.match(serviceReadmeRaw, /## Contract for LLM Integrators/);
  const servicePackageAfterInit = JSON.parse(await readFile(path.join(serviceTarget, "package.json"), "utf8"));
  assert.equal(servicePackageAfterInit.scripts.publish, "node scripts/release-publish.mjs");
  const servicePublishScriptRaw = await readFile(path.join(serviceTarget, "scripts", "release-publish.mjs"), "utf8");
  assert.match(servicePublishScriptRaw, /versionExistsOnNpm/);
  assert.equal(servicePackageAfterInit.name, "demo-service");
  assert.equal(servicePackageAfterInit.repository.type, "git");
  assert.match(servicePackageAfterInit.repository.url, /github\.com/);
  const serviceVscodeSettingsRaw = await readFile(path.join(serviceTarget, ".vscode", "settings.json"), "utf8");
  assert.match(serviceVscodeSettingsRaw, /"editor\.formatOnSave": true/);
  assert.match(serviceVscodeSettingsRaw, /"source\.fixAll\.eslint"/);
  const serviceVscodeExtensionsRaw = await readFile(path.join(serviceTarget, ".vscode", "extensions.json"), "utf8");
  assert.match(serviceVscodeExtensionsRaw, /esbenp\.prettier-vscode/);
  assert.match(serviceVscodeExtensionsRaw, /dbaeumer\.vscode-eslint/);
  assert.match(serviceVscodeExtensionsRaw, /rvest\.vs-code-prettier-eslint/);
  const serviceConfigRaw = await readFile(path.join(serviceTarget, "src", "config.ts"), "utf8");
  assert.match(serviceConfigRaw, /EXTERNAL_STATUS_URL/);
  assert.match(serviceConfigRaw, /const CONFIG = \{/);
  assert.match(serviceConfigRaw, /export default CONFIG/);
  const serviceIndexRaw = await readFile(path.join(serviceTarget, "src", "index.ts"), "utf8");
  assert.match(serviceIndexRaw, /import CONFIG from "\.\/config\.ts";/);
  const serviceTsconfigRaw = await readFile(path.join(serviceTarget, "tsconfig.json"), "utf8");
  assert.match(serviceTsconfigRaw, /"rootDir": "\."/);
  assert.match(serviceTsconfigRaw, /"allowImportingTsExtensions": true/);
  assert.match(serviceTsconfigRaw, /"rewriteRelativeImportExtensions": true/);

  const serviceEntries = await readdir(serviceTarget);
  assert(!serviceEntries.includes("AGENTS.md"));
  assert(!serviceEntries.includes("ai"));
  const serviceProjectFiles = await listRelativeFiles(serviceTarget);
  const serviceForbiddenJs = serviceProjectFiles.filter((filePath) => {
    return (
      (filePath.startsWith("src/") || filePath.startsWith("test/")) && (filePath.endsWith(".js") || filePath.endsWith(".mjs") || filePath.endsWith(".cjs"))
    );
  });
  assert.equal(serviceForbiddenJs.length, 0, `unexpected JS files in service scaffold: ${serviceForbiddenJs}`);

  result = runCliWithFakeNpm(["refresh", "--template", "node-lib", "--no-ai-adapters", "--yes"], serviceTarget);
  assert.equal(result.status, 0, result.stderr);
  const serviceAfterTemplateOverride = JSON.parse(await readFile(path.join(serviceTarget, "package.json"), "utf8"));
  assert.equal(serviceAfterTemplateOverride.main, "dist/index.js");
  assert.equal(serviceAfterTemplateOverride.types, "dist/index.d.ts");
  assert.deepEqual(serviceAfterTemplateOverride.files, ["dist"]);
  assert.equal(serviceAfterTemplateOverride.codeStandards.template, "node-lib");
  const serviceFilesAfterOverride = await listRelativeFiles(serviceTarget);
  assert(serviceFilesAfterOverride.includes("tsconfig.build.json"));

  result = runCli(["init", "--template", "node-service", "--yes", "--no-install", "--no-ai-adapters"], legacyTarget);
  assert.equal(result.status, 0, result.stderr);
  const legacyPackagePath = path.join(legacyTarget, "package.json");
  const legacyPackage = JSON.parse(await readFile(legacyPackagePath, "utf8"));
  delete legacyPackage.codeStandards;
  await writeFile(legacyPackagePath, `${JSON.stringify(legacyPackage, null, 2)}\n`, "utf8");
  result = runCliWithFakeNpm(["refresh", "--no-ai-adapters", "--yes"], legacyTarget);
  assert.equal(result.status, 0, result.stderr);
  const legacyPackageAfterRefresh = JSON.parse(await readFile(legacyPackagePath, "utf8"));
  assert.equal(legacyPackageAfterRefresh.codeStandards.template, "node-service");

  result = runCli(["init", "--template", "node-service", "--yes", "--no-install", "--no-ai-adapters"], installTarget);
  assert.equal(result.status, 0, result.stderr);
  await writeFile(fakeNpmLogPath, "", "utf8");
  result = runCliWithFakeNpm(["refresh", "--no-ai-adapters", "--yes"], installTarget);
  assert.equal(result.status, 0, result.stderr);
  result = runCliWithFakeNpm(["refresh", "--install", "--no-ai-adapters", "--yes"], installTarget);
  assert.equal(result.status, 0, result.stderr);
  const fakeNpmLog = await readFile(fakeNpmLogPath, "utf8");
  const installInvocations = fakeNpmLog
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  assert.deepEqual(installInvocations, ["run fix", "run check", "install", "run fix", "run check"]);

  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install"], gitOnlyTarget);
  assert.equal(result.status, 0, result.stderr);
  const gitOnlyEntries = await readdir(gitOnlyTarget);
  assert(gitOnlyEntries.includes(".git"));
  assert(gitOnlyEntries.includes("package.json"));

  result = runCli(
    [
      "init",
      "--template",
      "node-lib",
      "--yes",
      "--no-install",
      "--package-name",
      "@sha3/configured-sample",
      "--repository-url",
      "https://github.com/sha3/configured-sample"
    ],
    configuredTarget
  );
  assert.equal(result.status, 0, result.stderr);
  const interactivePackage = JSON.parse(await readFile(path.join(configuredTarget, "package.json"), "utf8"));
  assert.equal(interactivePackage.name, "@sha3/configured-sample");
  assert.equal(interactivePackage.repository.url, "https://github.com/sha3/configured-sample");

  result = runCli(["init", "legacy-name", "--yes", "--no-install"], positionalTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Positional project names are not supported/);

  result = runCli(["init", "--template", "node-lib", "--target", "ignored", "--yes", "--no-install"], targetFlagTarget);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--target is not supported/);

  await writeFile(profileInvalidPath, JSON.stringify({ version: "v1" }, null, 2), "utf8");
  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install", "--profile", profileInvalidPath], brokenTarget);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid profile/);

  await mkdir(collisionTarget, { recursive: true });
  await writeFile(path.join(collisionTarget, "keep.txt"), "existing", "utf8");

  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install"], collisionTarget);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not empty/);

  result = runCli(["init", "--template", "node-lib", "--yes", "--no-install", "--force"], collisionTarget);

  assert.equal(result.status, 0, result.stderr);

  const eslintConfig = await import(path.join(repoRoot, "eslint", "base.mjs"));
  assert(Array.isArray(eslintConfig.default));

  const tsconfigFiles = await readdir(path.join(repoRoot, "tsconfig"));
  assert(tsconfigFiles.includes("node-lib.json"));
  const sharedLibTsconfigRaw = await readFile(path.join(repoRoot, "tsconfig", "node-lib.json"), "utf8");
  assert.doesNotMatch(sharedLibTsconfigRaw, /"rootDir"/);
  assert.doesNotMatch(sharedLibTsconfigRaw, /"outDir"/);
  const sharedServiceTsconfigRaw = await readFile(path.join(repoRoot, "tsconfig", "node-service.json"), "utf8");
  assert.doesNotMatch(sharedServiceTsconfigRaw, /"rootDir"/);
  assert.doesNotMatch(sharedServiceTsconfigRaw, /"outDir"/);

  console.log("smoke fixtures passed");
}

await main();
