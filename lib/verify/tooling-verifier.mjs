import { readFile } from "node:fs/promises";
import path from "node:path";

import { createContractIssue, getActiveVerifyRuleIds, shouldRunRule } from "./issue-helpers.mjs";

const REQUIRED_SCRIPT_NAMES = ["standards:check", "check", "fix", "lint", "format:check", "typecheck", "test"];

function createIssue(contract, ruleId, relativePath, message, options = {}) {
  return createContractIssue(contract, {
    ruleId,
    category: "tooling",
    relativePath,
    message,
    verificationMode: options.verificationMode,
    confidence: options.confidence,
    evidence: options.evidence,
  });
}

export async function verifyTooling(targetPath, contract, packageJson, options = {}) {
  const activeRuleIds = getActiveVerifyRuleIds(contract);
  const issues = [];
  const scripts = packageJson.scripts ?? {};
  const template = contract.project.template;

  if (activeRuleIds.has("required-scripts") && shouldRunRule(options.onlyRuleIds, "required-scripts")) {
    for (const scriptName of REQUIRED_SCRIPT_NAMES) {
      if (typeof scripts[scriptName] !== "string" || scripts[scriptName].trim().length === 0) {
        issues.push(createIssue(contract, "required-scripts", "package.json", `missing required script: ${scriptName}`));
      }
    }
  }

  if (activeRuleIds.has("standards-check-script") && shouldRunRule(options.onlyRuleIds, "standards-check-script")) {
    if (typeof scripts["standards:check"] !== "string" || !scripts["standards:check"].includes("code-standards verify")) {
      issues.push(createIssue(contract, "standards-check-script", "package.json", "standards:check must execute code-standards verify"));
    }
  }

  if (activeRuleIds.has("package-exports-alignment") && shouldRunRule(options.onlyRuleIds, "package-exports-alignment")) {
    const tsconfigJson = await readOptionalJson(path.join(targetPath, "tsconfig.json"));
    const expectedTsconfig = template === "node-service" ? "@sha3/code-standards/tsconfig/node-service.json" : "@sha3/code-standards/tsconfig/node-lib.json";

    if (tsconfigJson.extends !== expectedTsconfig) {
      issues.push(createIssue(contract, "package-exports-alignment", "tsconfig.json", `tsconfig.json must extend ${expectedTsconfig}`));
    }

    const biomeJson = await readOptionalJson(path.join(targetPath, "biome.json"));
    if (!isExpectedBiomeConfig(biomeJson)) {
      issues.push(
        createIssue(contract, "package-exports-alignment", "biome.json", "biome.json must stay aligned with the exported @sha3/code-standards biome baseline"),
      );
    }
  }

  return issues;
}

async function readOptionalJson(absolutePath) {
  const raw = await readFile(absolutePath, "utf8").catch(() => null);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function isExpectedBiomeConfig(biomeJson) {
  return (
    biomeJson?.formatter?.lineWidth === 160 &&
    biomeJson?.javascript?.formatter?.quoteStyle === "double" &&
    biomeJson?.linter?.rules?.correctness?.noUnusedVariables === "error" &&
    biomeJson?.linter?.rules?.correctness?.noUnusedFunctionParameters === "error" &&
    biomeJson?.linter?.rules?.correctness?.noUnusedPrivateClassMembers === "error" &&
    biomeJson?.linter?.rules?.correctness?.noUnusedImports === "error" &&
    Array.isArray(biomeJson?.files?.ignore) &&
    biomeJson.files.ignore.includes(".code-standards") &&
    biomeJson.files.ignore.includes("dist")
  );
}
