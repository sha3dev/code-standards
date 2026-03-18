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
    const warningSuffix = result.hasWarnings ? ` (${result.summary.warningCount} warning(s), ${result.summary.auditCount} audit item(s))` : "";
    return `standards verification passed${warningSuffix}`;
  }

  return result.issues
    .map((issue) => {
      const location = formatLocation(issue);
      const mode = issue.verificationMode ? `/${issue.verificationMode}` : "";
      const severity = issue.severity ? `${issue.severity.toUpperCase()} ` : "";
      const evidence = issue.evidence ? ` (${issue.evidence})` : "";
      return location.length > 0
        ? `- ${severity}[${issue.ruleId}${mode}] ${location}: ${issue.message}${evidence}`
        : `- ${severity}[${issue.ruleId}${mode}] ${issue.message}${evidence}`;
    })
    .join("\n");
}
