import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { AI_ADAPTER_FILES, README_REQUIRED_HEADINGS, TEMPLATE_NAMES, TEMPLATE_REQUIRED_FILES } from "../constants.mjs";
import { loadContractSchema } from "../contract/load-rule-catalog.mjs";
import { resolvePackageRoot } from "../paths.mjs";
import { readProjectPackageJson } from "../project/package-metadata.mjs";
import { listRelativeFiles } from "../project/template-resolution.mjs";
import { pathExists, readJsonFile, validateAgainstSchema } from "../utils/fs.mjs";
import {
  PROJECT_VERIFY_RULE_IDS,
  buildVerificationResult,
  createVerificationIssue,
  isFileSelected,
  normalizeRequestedFiles,
  shouldRunRule,
} from "./issue-helpers.mjs";
import { verifySourceRules } from "./source-rule-verifier.mjs";

const DISALLOWED_SOURCE_EXTENSIONS = [".js", ".mjs", ".cjs"];

function isForbiddenSourceFile(filePath) {
  return (filePath.startsWith("src/") || filePath.startsWith("test/")) && DISALLOWED_SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
}

function collectReadmeFailures(readmeRaw) {
  return README_REQUIRED_HEADINGS.filter((heading) => !readmeRaw.includes(heading)).map((heading) => `missing required README heading: ${heading}`);
}

function addCheckedRuleId(checkedRuleIds, onlyRuleIds, ruleId) {
  if (shouldRunRule(onlyRuleIds, ruleId)) {
    checkedRuleIds.push(ruleId);
  }
}

export async function verifyProject(targetPath, options = {}) {
  const packageRoot = resolvePackageRoot();
  const issues = [];
  const checkedRuleIds = [];
  const checkedFiles = [];
  const contractPath = path.join(targetPath, "ai", "contract.json");
  const agentsPath = path.join(targetPath, "AGENTS.md");
  const selectedFiles = normalizeRequestedFiles(targetPath, options.files);
  const shouldCheckReadme = isFileSelected(selectedFiles, "README.md");
  const shouldCheckSourceSubset = selectedFiles.length === 0 || selectedFiles.some((filePath) => filePath.startsWith("src/") || filePath.startsWith("test/"));

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "contract-presence");

  if (!(await pathExists(agentsPath)) && shouldRunRule(options.onlyRuleIds, "contract-presence")) {
    checkedFiles.push("AGENTS.md");
    issues.push(
      createVerificationIssue({
        ruleId: "contract-presence",
        category: "contract",
        relativePath: "AGENTS.md",
        message: "missing AGENTS.md",
      }),
    );
  }

  if (!(await pathExists(contractPath)) && shouldRunRule(options.onlyRuleIds, "contract-presence")) {
    checkedFiles.push("ai/contract.json");
    issues.push(
      createVerificationIssue({
        ruleId: "contract-presence",
        category: "contract",
        relativePath: "ai/contract.json",
        message: "missing ai/contract.json",
      }),
    );
  }

  if (issues.length > 0) {
    return buildVerificationResult(issues, checkedRuleIds, checkedFiles);
  }

  const [contract, contractSchema, { packageJson }] = await Promise.all([
    readJsonFile(contractPath),
    loadContractSchema(packageRoot),
    readProjectPackageJson(targetPath),
  ]);

  validateAgainstSchema(contract, contractSchema, contractPath);

  const files = await listRelativeFiles(targetPath);
  const metadata = packageJson.codeStandards ?? {};

  if (!TEMPLATE_NAMES.includes(contract.project.template) && shouldRunRule(options.onlyRuleIds, "contract-presence")) {
    checkedFiles.push("ai/contract.json");
    issues.push(
      createVerificationIssue({
        ruleId: "contract-presence",
        category: "contract",
        relativePath: "ai/contract.json",
        message: `unsupported template in contract: ${contract.project.template}`,
      }),
    );
  }

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "metadata-sync");
  if (shouldRunRule(options.onlyRuleIds, "metadata-sync")) {
    checkedFiles.push("package.json", "ai/contract.json");

    if (metadata.contractVersion !== contract.formatVersion) {
      issues.push(
        createVerificationIssue({
          ruleId: "metadata-sync",
          category: "metadata-sync",
          relativePath: "package.json",
          message: "package.json.codeStandards.contractVersion must match ai/contract.json formatVersion",
        }),
      );
    }

    if (metadata.template !== contract.project.template) {
      issues.push(
        createVerificationIssue({
          ruleId: "metadata-sync",
          category: "metadata-sync",
          relativePath: "package.json",
          message: "package.json.codeStandards.template must match ai/contract.json project.template",
        }),
      );
    }

    if (metadata.withAiAdapters !== contract.project.withAiAdapters) {
      issues.push(
        createVerificationIssue({
          ruleId: "metadata-sync",
          category: "metadata-sync",
          relativePath: "package.json",
          message: "package.json.codeStandards.withAiAdapters must match ai/contract.json project.withAiAdapters",
        }),
      );
    }
  }

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "managed-files");
  if (shouldRunRule(options.onlyRuleIds, "managed-files")) {
    for (const managedFile of contract.managedFiles) {
      checkedFiles.push(managedFile);
      if (!(await pathExists(path.join(targetPath, managedFile)))) {
        issues.push(
          createVerificationIssue({
            ruleId: "managed-files",
            category: "managed-files",
            relativePath: managedFile,
            message: `missing managed file: ${managedFile}`,
          }),
        );
      }
    }
  }

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "typescript-only");
  if (shouldRunRule(options.onlyRuleIds, "typescript-only") && shouldCheckSourceSubset) {
    const checkedSourceFiles = files.filter(
      (filePath) => (filePath.startsWith("src/") || filePath.startsWith("test/")) && isFileSelected(selectedFiles, filePath),
    );
    checkedFiles.push(...checkedSourceFiles);

    for (const filePath of checkedSourceFiles.filter(isForbiddenSourceFile)) {
      issues.push(
        createVerificationIssue({
          ruleId: "typescript-only",
          category: "typescript-only",
          relativePath: filePath,
          message: `forbidden JS file in src/test: ${filePath}`,
        }),
      );
    }
  }

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "template-layout");
  if (shouldRunRule(options.onlyRuleIds, "template-layout")) {
    const requiredTemplateFiles = (TEMPLATE_REQUIRED_FILES[contract.project.template] ?? []).filter((filePath) => isFileSelected(selectedFiles, filePath));
    checkedFiles.push(...requiredTemplateFiles);

    for (const requiredFile of requiredTemplateFiles) {
      if (!files.includes(requiredFile)) {
        issues.push(
          createVerificationIssue({
            ruleId: "template-layout",
            category: "template-layout",
            relativePath: requiredFile,
            message: `missing required template file: ${requiredFile}`,
          }),
        );
      }
    }
  }

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "readme-sections");
  if (shouldRunRule(options.onlyRuleIds, "readme-sections") && shouldCheckReadme) {
    checkedFiles.push("README.md");
    const readmeRaw = await readFile(path.join(targetPath, "README.md"), "utf8");
    for (const failure of collectReadmeFailures(readmeRaw)) {
      issues.push(
        createVerificationIssue({
          ruleId: "readme-sections",
          category: "readme",
          relativePath: "README.md",
          message: failure,
        }),
      );
    }
  }

  addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, "adapter-presence");
  if (contract.project.withAiAdapters && shouldRunRule(options.onlyRuleIds, "adapter-presence")) {
    const adapterDir = path.join(targetPath, "ai");
    const adapterEntries = await readdir(adapterDir);
    for (const adapterName of AI_ADAPTER_FILES) {
      const relativePath = path.join("ai", adapterName).split(path.sep).join("/");
      checkedFiles.push(relativePath);
      if (!adapterEntries.includes(adapterName)) {
        issues.push(
          createVerificationIssue({
            ruleId: "adapter-presence",
            category: "adapter-presence",
            relativePath,
            message: `missing ai/${adapterName}`,
          }),
        );
      }
    }
  }

  const sourceResult = await verifySourceRules(targetPath, contract, {
    onlyRuleIds: options.onlyRuleIds,
    files: selectedFiles,
  });
  issues.push(...sourceResult);

  for (const ruleId of contract.rules.filter((rule) => rule.deterministic).map((rule) => rule.id)) {
    addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, ruleId);
  }

  const checkedSourceFiles = files.filter(
    (filePath) => (filePath.startsWith("src/") || filePath.startsWith("test/")) && isFileSelected(selectedFiles, filePath),
  );
  checkedFiles.push(...checkedSourceFiles);

  return buildVerificationResult(issues, checkedRuleIds, checkedFiles);
}
