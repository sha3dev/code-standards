import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { README_REQUIRED_HEADINGS, TEMPLATE_NAMES } from "../constants.mjs";
import { loadContractSchema } from "../contract/load-rule-catalog.mjs";
import { resolvePackageRoot } from "../paths.mjs";
import { readProjectPackageJson } from "../project/package-metadata.mjs";
import { listRelativeFiles } from "../project/template-resolution.mjs";
import { pathExists, readJsonFile, validateAgainstSchema } from "../utils/fs.mjs";

const AMBIGUOUS_FILE_NAMES = new Set(["utils.ts", "helpers.ts", "common.ts"]);
const DISALLOWED_SOURCE_EXTENSIONS = [".js", ".mjs", ".cjs"];

function isForbiddenSourceFile(filePath) {
  return (filePath.startsWith("src/") || filePath.startsWith("test/")) && DISALLOWED_SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
}

function collectReadmeFailures(readmeRaw) {
  return README_REQUIRED_HEADINGS.filter((heading) => !readmeRaw.includes(heading)).map((heading) => `missing required README heading: ${heading}`);
}

function collectFeatureFileFailures(files) {
  return files
    .filter((filePath) => filePath.startsWith("src/"))
    .filter((filePath) => AMBIGUOUS_FILE_NAMES.has(path.basename(filePath)))
    .map((filePath) => `ambiguous feature filename is forbidden: ${filePath}`);
}

function verifyTemplateLayout(template, files) {
  const requiredByTemplate = {
    "node-lib": ["src/config.ts", "src/greeter/greeter.service.ts", "src/index.ts", "test/greeter.test.ts"],
    "node-service": [
      "src/config.ts",
      "src/status/status.service.ts",
      "src/http/http-server.service.ts",
      "src/app/service-runtime.service.ts",
      "src/index.ts",
      "src/main.ts",
      "test/service-runtime.test.ts"
    ]
  };

  return (requiredByTemplate[template] ?? []).filter((filePath) => !files.includes(filePath)).map((filePath) => `missing required template file: ${filePath}`);
}

export async function verifyProject(targetPath) {
  const packageRoot = resolvePackageRoot();
  const errors = [];
  const contractPath = path.join(targetPath, "ai", "contract.json");
  const agentsPath = path.join(targetPath, "AGENTS.md");

  if (!(await pathExists(agentsPath))) {
    errors.push("[contract-presence] missing AGENTS.md");
  }

  if (!(await pathExists(contractPath))) {
    errors.push("[contract-presence] missing ai/contract.json");
  }

  if (errors.length > 0) {
    return errors;
  }

  const [contract, contractSchema, { packageJson }] = await Promise.all([
    readJsonFile(contractPath),
    loadContractSchema(packageRoot),
    readProjectPackageJson(targetPath)
  ]);

  validateAgainstSchema(contract, contractSchema, contractPath);

  const files = await listRelativeFiles(targetPath);
  const metadata = packageJson.codeStandards ?? {};

  if (!TEMPLATE_NAMES.includes(contract.project.template)) {
    errors.push(`[contract-shape] unsupported template in contract: ${contract.project.template}`);
  }

  if (metadata.contractVersion !== contract.formatVersion) {
    errors.push("[metadata-sync] package.json.codeStandards.contractVersion must match ai/contract.json formatVersion");
  }

  if (metadata.template !== contract.project.template) {
    errors.push("[metadata-sync] package.json.codeStandards.template must match ai/contract.json project.template");
  }

  for (const managedFile of contract.managedFiles) {
    if (!(await pathExists(path.join(targetPath, managedFile)))) {
      errors.push(`[managed-files] missing managed file: ${managedFile}`);
    }
  }

  for (const filePath of files.filter(isForbiddenSourceFile)) {
    errors.push(`[typescript-only] forbidden JS file in src/test: ${filePath}`);
  }

  for (const failure of verifyTemplateLayout(contract.project.template, files)) {
    errors.push(`[template-layout] ${failure}`);
  }

  for (const failure of collectFeatureFileFailures(files)) {
    errors.push(`[naming] ${failure}`);
  }

  const readmeRaw = await readFile(path.join(targetPath, "README.md"), "utf8");
  for (const failure of collectReadmeFailures(readmeRaw)) {
    errors.push(`[readme] ${failure}`);
  }

  if (contract.project.withAiAdapters) {
    const adapterDir = path.join(targetPath, "ai");
    const adapterEntries = await readdir(adapterDir);
    for (const adapterName of ["codex.md", "cursor.md", "copilot.md", "windsurf.md"]) {
      if (!adapterEntries.includes(adapterName)) {
        errors.push(`[adapter-presence] missing ai/${adapterName}`);
      }
    }
  }

  return errors;
}
