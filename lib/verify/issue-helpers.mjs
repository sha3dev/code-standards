import path from "node:path";

export const PROJECT_VERIFY_RULE_IDS = [
  "contract-presence",
  "metadata-sync",
  "managed-files",
  "typescript-only",
  "template-layout",
  "readme-sections",
  "readme-public-api",
  "readme-public-methods",
  "readme-http-api",
  "readme-usage-examples",
  "adapter-presence",
];

export const FAILURE_SEVERITIES = new Set(["error"]);
export const STRICT_FAILURE_SEVERITIES = new Set(["error", "warning"]);

export function createVerificationIssue(options) {
  const issue = {
    ruleId: options.ruleId,
    category: options.category,
    severity: options.severity ?? "error",
    message: options.message,
    enforcedBy: "verify",
    verificationMode: options.verificationMode ?? "deterministic",
    confidence: options.confidence ?? "high",
  };

  if (options.relativePath) {
    issue.relativePath = options.relativePath;
  }

  if (typeof options.line === "number") {
    issue.line = options.line;
  }

  if (typeof options.column === "number") {
    issue.column = options.column;
  }

  if (options.evidence) {
    issue.evidence = options.evidence;
  }

  if (options.suggestion) {
    issue.suggestion = options.suggestion;
  }

  return issue;
}

export function shouldRunRule(onlyRuleIds, ruleId) {
  if (!onlyRuleIds || onlyRuleIds.length === 0) {
    return true;
  }

  return onlyRuleIds.includes(ruleId);
}

export function getRuleMap(contract, predicate = () => true) {
  return new Map(contract.rules.filter(predicate).map((rule) => [rule.id, rule]));
}

export function getVerifyRuleMap(contract) {
  return getRuleMap(contract, (rule) => rule.enforcedBy.includes("verify"));
}

export function getActiveVerifyRuleIds(contract) {
  return new Set(getVerifyRuleMap(contract).keys());
}

export function getRuleSeverity(contract, ruleId, fallbackSeverity = "error") {
  return getVerifyRuleMap(contract).get(ruleId)?.severity ?? fallbackSeverity;
}

export function createContractIssue(contract, options) {
  return createVerificationIssue({
    ...options,
    severity: options.severity ?? getRuleSeverity(contract, options.ruleId),
  });
}

export function normalizeRequestedFiles(targetPath, files) {
  if (!files || files.length === 0) {
    return [];
  }

  const normalizedFiles = new Set();

  for (const rawFile of files) {
    const resolvedPath = path.isAbsolute(rawFile) ? rawFile : path.resolve(targetPath, rawFile);
    const relativePath = path.relative(targetPath, resolvedPath).split(path.sep).join("/");

    if (relativePath.length === 0 || relativePath === ".") {
      continue;
    }

    normalizedFiles.add(relativePath);
  }

  return [...normalizedFiles].sort((left, right) => left.localeCompare(right));
}

export function isFileSelected(selectedFiles, relativePath) {
  if (!selectedFiles || selectedFiles.length === 0) {
    return true;
  }

  return selectedFiles.includes(relativePath);
}

export function buildVerificationResult(issues, checkedRuleIds, checkedFiles, options = {}) {
  const failureSeverities = options.failureSeverities ?? (options.strict ? STRICT_FAILURE_SEVERITIES : FAILURE_SEVERITIES);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const auditCount = issues.filter((issue) => issue.severity === "audit").length;
  return {
    ok: !issues.some((issue) => failureSeverities.has(issue.severity)),
    hasWarnings: warningCount > 0,
    issues,
    summary: {
      issueCount: issues.length,
      errorCount,
      warningCount,
      auditCount,
      checkedRuleIds: [...new Set(checkedRuleIds)].sort((left, right) => left.localeCompare(right)),
      checkedFiles: [...new Set(checkedFiles)].sort((left, right) => left.localeCompare(right)),
    },
  };
}
