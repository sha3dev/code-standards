import { readdir } from "node:fs/promises";
import path from "node:path";

import { AI_ADAPTER_FILES, TEMPLATE_NAMES, TEMPLATE_REQUIRED_FILES } from "../constants.mjs";
import { loadContractSchema } from "../contract/load-rule-catalog.mjs";
import { resolvePackageRoot } from "../paths.mjs";
import { readProjectPackageJson } from "../project/package-metadata.mjs";
import { listRelativeFiles } from "../project/template-resolution.mjs";
import { pathExists, readJsonFile, validateAgainstSchema } from "../utils/fs.mjs";
import { verifyChangeAudits } from "./change-audit-verifier.mjs";
import { readChangedFiles } from "./change-context.mjs";
import { verifyErrorHandling } from "./error-handling-verifier.mjs";
import {
  buildVerificationResult,
  createVerificationIssue,
  getVerifyRuleMap,
  isFileSelected,
  normalizeRequestedFiles,
  shouldRunRule,
} from "./issue-helpers.mjs";
import { verifyProjectLayout } from "./project-layout-verifier.mjs";
import { verifyReadme } from "./readme-verifier.mjs";
import { loadProjectAnalysisContext } from "./source-analysis.mjs";
import { verifySourceRules } from "./source-rule-verifier.mjs";
import { verifyTestingRules } from "./testing-verifier.mjs";
import { verifyTooling } from "./tooling-verifier.mjs";
import { verifyTypeScriptStyle } from "./typescript-style-verifier.mjs";

const DISALLOWED_SOURCE_EXTENSIONS = [".js", ".mjs", ".cjs"];

function isForbiddenSourceFile(filePath) {
  return (filePath.startsWith("src/") || filePath.startsWith("test/")) && DISALLOWED_SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
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
    return buildVerificationResult(issues, checkedRuleIds, checkedFiles, { strict: options.strict });
  }

  const [contract, contractSchema, { packageJson }] = await Promise.all([
    readJsonFile(contractPath),
    loadContractSchema(packageRoot),
    readProjectPackageJson(targetPath),
  ]);

  validateAgainstSchema(contract, contractSchema, contractPath);

  const files = await listRelativeFiles(targetPath);
  const metadata = packageJson.codeStandards ?? {};
  const analysisContext = shouldCheckSourceSubset ? await loadProjectAnalysisContext(targetPath, { files: selectedFiles }) : null;
  const changedFilesContext = readChangedFiles(targetPath, {
    changedAgainst: options.changedAgainst,
    staged: options.staged,
    allFiles: options.allFiles,
  });

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

  for (const ruleId of ["readme-sections", "readme-public-api", "readme-public-methods", "readme-http-api", "readme-usage-examples"]) {
    addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, ruleId);
  }
  if (shouldCheckReadme) {
    checkedFiles.push("README.md");
    const readmeIssues = await verifyReadme(targetPath, {
      template: contract.project.template,
      packageName: packageJson.name,
      onlyRuleIds: options.onlyRuleIds,
      contract,
    });
    issues.push(...readmeIssues.filter((issue) => shouldRunRule(options.onlyRuleIds, issue.ruleId)));
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

  if (analysisContext) {
    const [sourceResult, layoutIssues, tsStyleIssues, errorHandlingIssues, testingIssues, changeAuditIssues] = await Promise.all([
      verifySourceRules(targetPath, contract, {
        onlyRuleIds: options.onlyRuleIds,
        files: selectedFiles,
        analysisContext,
      }),
      verifyProjectLayout(targetPath, contract, analysisContext, { onlyRuleIds: options.onlyRuleIds }),
      verifyTypeScriptStyle(targetPath, contract, analysisContext, { onlyRuleIds: options.onlyRuleIds }),
      verifyErrorHandling(targetPath, contract, analysisContext, { onlyRuleIds: options.onlyRuleIds }),
      verifyTestingRules(targetPath, contract, analysisContext, changedFilesContext, { onlyRuleIds: options.onlyRuleIds }),
      verifyChangeAudits(targetPath, contract, analysisContext, changedFilesContext, { onlyRuleIds: options.onlyRuleIds }),
    ]);
    issues.push(...sourceResult, ...layoutIssues, ...tsStyleIssues, ...errorHandlingIssues, ...testingIssues, ...changeAuditIssues);
  }

  const toolingIssues = await verifyTooling(targetPath, contract, packageJson, { onlyRuleIds: options.onlyRuleIds });
  issues.push(...toolingIssues);

  for (const ruleId of getVerifyRuleMap(contract).keys()) {
    addCheckedRuleId(checkedRuleIds, options.onlyRuleIds, ruleId);
  }

  const checkedSourceFiles = files.filter(
    (filePath) => (filePath.startsWith("src/") || filePath.startsWith("test/")) && isFileSelected(selectedFiles, filePath),
  );
  checkedFiles.push(...checkedSourceFiles);

  return buildVerificationResult(issues, checkedRuleIds, checkedFiles, { strict: options.strict });
}
