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
      return location.length > 0 ? `- [${issue.ruleId}] ${location}: ${issue.message}` : `- [${issue.ruleId}] ${issue.message}`;
    })
    .join("\n");
}
