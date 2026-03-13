import ts from "typescript";

import { createVerificationIssue, shouldRunRule } from "./issue-helpers.mjs";
import { getLineAndColumn } from "./source-analysis.mjs";

const TEST_NON_DETERMINISM_PATTERNS = [
  { pattern: /\bDate\.now\(/, label: "Date.now()" },
  { pattern: /\bMath\.random\(/, label: "Math.random()" },
  { pattern: /\bsetTimeout\(/, label: "setTimeout()" },
  { pattern: /\bsetInterval\(/, label: "setInterval()" },
  { pattern: /\bprocess\.env\.[A-Z0-9_]+\s*=/, label: "process.env mutation" },
];

function getActiveRuleIds(contract) {
  return new Set(contract.rules.filter((rule) => rule.blocking).map((rule) => rule.id));
}

function createIssue(ruleId, relativePath, node, message, options = {}) {
  const location = node && "getStart" in node && "getSourceFile" in node ? getLineAndColumn(node.getSourceFile(), node.getStart(node.getSourceFile())) : {};
  return createVerificationIssue({
    ruleId,
    category: "testing",
    relativePath,
    line: location.line,
    column: location.column,
    message,
    verificationMode: options.verificationMode,
    confidence: options.confidence,
    evidence: options.evidence,
  });
}

function hasImportFrom(file, moduleName) {
  return file.ast.statements.some(
    (statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === moduleName,
  );
}

export async function verifyTestingRules(_targetPath, contract, analysisContext, changedFilesContext, options = {}) {
  const activeRuleIds = getActiveRuleIds(contract);
  const issues = [];
  const testFiles = analysisContext.sourceFiles.filter((file) => file.relativePath.startsWith("test/"));

  for (const file of testFiles) {
    if (activeRuleIds.has("node-test-runner-only") && shouldRunRule(options.onlyRuleIds, "node-test-runner-only") && !hasImportFrom(file, "node:test")) {
      issues.push(createIssue("node-test-runner-only", file.relativePath, file.ast, "tests must import node:test"));
    }

    if (
      activeRuleIds.has("assert-strict-preferred") &&
      shouldRunRule(options.onlyRuleIds, "assert-strict-preferred") &&
      !hasImportFrom(file, "node:assert/strict")
    ) {
      issues.push(createIssue("assert-strict-preferred", file.relativePath, file.ast, "tests must import node:assert/strict"));
    }

    if (activeRuleIds.has("no-ts-ignore-bypass") && shouldRunRule(options.onlyRuleIds, "no-ts-ignore-bypass")) {
      const bypassMatch = file.raw.match(/@ts-ignore|@ts-expect-error|biome-ignore/);
      if (bypassMatch) {
        issues.push(createIssue("no-ts-ignore-bypass", file.relativePath, file.ast, `ignore directive is forbidden: ${bypassMatch[0]}`));
      }
    }

    if (activeRuleIds.has("test-determinism-guards") && shouldRunRule(options.onlyRuleIds, "test-determinism-guards")) {
      for (const signal of TEST_NON_DETERMINISM_PATTERNS) {
        if (signal.pattern.test(file.raw)) {
          issues.push(
            createIssue("test-determinism-guards", file.relativePath, file.ast, "tests should avoid uncontrolled non-deterministic primitives", {
              verificationMode: "heuristic",
              confidence: "medium",
              evidence: signal.label,
            }),
          );
        }
      }
    }
  }

  if (activeRuleIds.has("test-file-naming") && shouldRunRule(options.onlyRuleIds, "test-file-naming")) {
    for (const file of analysisContext.sourceFiles.filter((candidate) => candidate.relativePath.startsWith("test/"))) {
      if (!file.relativePath.endsWith(".test.ts")) {
        issues.push(createIssue("test-file-naming", file.relativePath, file.ast, "test files must use the .test.ts suffix"));
      }
    }
  }

  if (activeRuleIds.has("behavior-change-tests") && shouldRunRule(options.onlyRuleIds, "behavior-change-tests")) {
    issues.push(...verifyBehaviorChangeTests(changedFilesContext));
  }

  return issues;
}

function verifyBehaviorChangeTests(changedFilesContext) {
  if (!changedFilesContext.available) {
    return [];
  }

  const changedSourceFiles = changedFilesContext.files.filter((file) => file.startsWith("src/") && file.endsWith(".ts"));
  const changedTestFiles = changedFilesContext.files.filter((file) => file.startsWith("test/") && file.endsWith(".ts"));

  if (changedSourceFiles.length > 0 && changedTestFiles.length === 0) {
    return [
      createVerificationIssue({
        ruleId: "behavior-change-tests",
        category: "testing",
        message: "source changes require at least one changed test file",
        verificationMode: "audit",
        confidence: "medium",
        evidence: `${changedSourceFiles.length} src file(s) changed, 0 test file(s) changed`,
      }),
    ];
  }

  return [];
}
