import { readFile } from "node:fs/promises";
import path from "node:path";

import { createVerificationIssue, shouldRunRule } from "./issue-helpers.mjs";

const REQUIRED_SCRIPT_NAMES = ["standards:check", "check", "fix", "lint", "format:check", "typecheck", "test"];

function getActiveRuleIds(contract) {
  return new Set(contract.rules.filter((rule) => rule.blocking).map((rule) => rule.id));
}

function createIssue(ruleId, relativePath, message, options = {}) {
  return createVerificationIssue({
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
  const activeRuleIds = getActiveRuleIds(contract);
  const issues = [];
  const scripts = packageJson.scripts ?? {};
  const template = contract.project.template;

  if (activeRuleIds.has("required-scripts") && shouldRunRule(options.onlyRuleIds, "required-scripts")) {
    for (const scriptName of REQUIRED_SCRIPT_NAMES) {
      if (typeof scripts[scriptName] !== "string" || scripts[scriptName].trim().length === 0) {
        issues.push(createIssue("required-scripts", "package.json", `missing required script: ${scriptName}`));
      }
    }
  }

  if (activeRuleIds.has("standards-check-script") && shouldRunRule(options.onlyRuleIds, "standards-check-script")) {
    if (typeof scripts["standards:check"] !== "string" || !scripts["standards:check"].includes("code-standards verify")) {
      issues.push(createIssue("standards-check-script", "package.json", "standards:check must execute code-standards verify"));
    }
  }

  if (activeRuleIds.has("package-exports-alignment") && shouldRunRule(options.onlyRuleIds, "package-exports-alignment")) {
    const tsconfigRaw = await readOptionalText(path.join(targetPath, "tsconfig.json"));
    const expectedTsconfig = template === "node-service" ? "@sha3/code-standards/tsconfig/node-service.json" : "@sha3/code-standards/tsconfig/node-lib.json";

    if (!tsconfigRaw.includes(`"extends": "${expectedTsconfig}"`)) {
      issues.push(createIssue("package-exports-alignment", "tsconfig.json", `tsconfig.json must extend ${expectedTsconfig}`));
    }

    const biomeRaw = await readOptionalText(path.join(targetPath, "biome.json"));
    if (!biomeRaw.includes('"lineWidth": 160') || !biomeRaw.includes('"quoteStyle": "double"')) {
      issues.push(createIssue("package-exports-alignment", "biome.json", "biome.json must stay aligned with the exported @sha3/code-standards biome baseline"));
    }
  }

  return issues;
}

async function readOptionalText(absolutePath) {
  return readFile(absolutePath, "utf8").catch(() => "");
}
