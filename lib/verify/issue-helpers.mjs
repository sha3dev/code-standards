import path from "node:path";

export const PROJECT_VERIFY_RULE_IDS = [
  "contract-presence",
  "metadata-sync",
  "managed-files",
  "typescript-only",
  "template-layout",
  "readme-sections",
  "adapter-presence",
];

export function createVerificationIssue(options) {
  const issue = {
    ruleId: options.ruleId,
    category: options.category,
    severity: "error",
    message: options.message,
    enforcedBy: "verify",
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

  return issue;
}

export function shouldRunRule(onlyRuleIds, ruleId) {
  if (!onlyRuleIds || onlyRuleIds.length === 0) {
    return true;
  }

  return onlyRuleIds.includes(ruleId);
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

export function buildVerificationResult(issues, checkedRuleIds, checkedFiles) {
  return {
    ok: issues.length === 0,
    issues,
    summary: {
      issueCount: issues.length,
      checkedRuleIds: [...new Set(checkedRuleIds)].sort((left, right) => left.localeCompare(right)),
      checkedFiles: [...new Set(checkedFiles)].sort((left, right) => left.localeCompare(right)),
    },
  };
}
