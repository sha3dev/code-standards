import ts from "typescript";

import { createVerificationIssue, shouldRunRule } from "./issue-helpers.mjs";

const MANAGED_FILE_PREFIXES = ["AGENTS.md", "ai/", "prompts/", "biome.json", "tsconfig.json", "tsconfig.build.json", ".vscode/"];

function getActiveRuleIds(contract) {
  return new Set(contract.rules.filter((rule) => rule.blocking).map((rule) => rule.id));
}

function createIssue(ruleId, relativePath, message, options = {}) {
  return createVerificationIssue({
    ruleId,
    category: "change-audit",
    relativePath,
    message,
    verificationMode: options.verificationMode,
    confidence: options.confidence,
    evidence: options.evidence,
  });
}

export async function verifyChangeAudits(targetPath, contract, analysisContext, changedFilesContext, options = {}) {
  const activeRuleIds = getActiveRuleIds(contract);
  const issues = [];

  if (activeRuleIds.has("managed-files-read-only") && shouldRunRule(options.onlyRuleIds, "managed-files-read-only")) {
    issues.push(...verifyManagedFilesReadOnly(changedFilesContext));
  }

  if (activeRuleIds.has("simplicity-audit") && shouldRunRule(options.onlyRuleIds, "simplicity-audit")) {
    issues.push(...verifySimplicityAudit(analysisContext));
  }

  if (activeRuleIds.has("no-speculative-abstractions") && shouldRunRule(options.onlyRuleIds, "no-speculative-abstractions")) {
    issues.push(...verifyNoSpeculativeAbstractions(analysisContext));
  }

  return issues;
}

function verifyManagedFilesReadOnly(changedFilesContext) {
  if (!changedFilesContext.available) {
    return [];
  }

  const changedManagedFiles = changedFilesContext.files.filter((file) => MANAGED_FILE_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix)));
  return changedManagedFiles.map((relativePath) =>
    createIssue("managed-files-read-only", relativePath, "managed files are read-only during normal feature work", {
      verificationMode: "audit",
      confidence: "medium",
    }),
  );
}

function verifySimplicityAudit(analysisContext) {
  const issues = [];
  const featureLayerCounts = new Map();

  for (const file of analysisContext.sourceFiles) {
    if (!file.featureName || file.relativePath.endsWith(".types.ts")) {
      continue;
    }

    const role = file.relativePath.split("/").at(-1)?.split(".").slice(-2, -1)[0] ?? "unknown";
    const roles = featureLayerCounts.get(file.featureName) ?? new Set();
    roles.add(role);
    featureLayerCounts.set(file.featureName, roles);
  }

  for (const [featureName, roles] of featureLayerCounts) {
    if (roles.size >= 4) {
      issues.push(
        createIssue(
          "simplicity-audit",
          `src/${featureName}`,
          "feature appears to have accumulated many role layers; review whether the design can be simplified",
          {
            verificationMode: "audit",
            confidence: "medium",
            evidence: [...roles].sort((left, right) => left.localeCompare(right)).join(", "),
          },
        ),
      );
    }
  }

  return issues;
}

function verifyNoSpeculativeAbstractions(analysisContext) {
  const issues = [];

  for (const file of analysisContext.sourceFiles.filter((candidate) => candidate.relativePath.startsWith("src/"))) {
    const wrapperSignals = countWrapperSignals(file.ast);
    if (wrapperSignals >= 6) {
      issues.push(
        createIssue("no-speculative-abstractions", file.relativePath, "file appears to contain multiple abstraction signals without proof of current need", {
          verificationMode: "heuristic",
          confidence: "medium",
          evidence: `${wrapperSignals} wrapper signal(s)`,
        }),
      );
    }
  }

  return issues;
}

function countWrapperSignals(ast) {
  let count = 0;

  function visit(node) {
    if (ts.isTypeAliasDeclaration(node) && /Options$/.test(node.name.text)) {
      count += 1;
    }

    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && /^(create|build|make)/.test(node.name.text)) {
      count += 1;
    }

    if (ts.isClassDeclaration(node) && node.name && /Factory|Builder|Wrapper/.test(node.name.text)) {
      count += 2;
    }

    ts.forEachChild(node, visit);
  }

  visit(ast);
  return count;
}
