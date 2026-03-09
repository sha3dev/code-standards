function formatLocation(issue) {
  if (!issue.relativePath) {
    return "";
  }

  if (typeof issue.line !== "number") {
    return issue.relativePath;
  }

  if (typeof issue.column !== "number") {
    return `${issue.relativePath}:${issue.line}`;
  }

  return `${issue.relativePath}:${issue.line}:${issue.column}`;
}

export function renderTextReport(result) {
  if (result.ok) {
    return "standards verification passed";
  }

  return result.issues
    .map((issue) => {
      const location = formatLocation(issue);
      const mode = issue.verificationMode ? `/${issue.verificationMode}` : "";
      const evidence = issue.evidence ? ` (${issue.evidence})` : "";
      return location.length > 0
        ? `- [${issue.ruleId}${mode}] ${location}: ${issue.message}${evidence}`
        : `- [${issue.ruleId}${mode}] ${issue.message}${evidence}`;
    })
    .join("\n");
}
