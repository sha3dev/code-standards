function renderList(items, fallback = "- none detected") {
  if (!items || items.length === 0) {
    return fallback;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function renderAnalysisSummary(projectPackageJson, sourceAnalysis, preservation) {
  const publicEntrypoints = sourceAnalysis.entrypoints.map((entrypoint) => `\`${entrypoint.kind}\`: \`${JSON.stringify(entrypoint.value)}\``);
  const compatibilityNotes = [
    `- preserve public API: ${preservation.publicApi ? "yes" : "no"}`,
    `- preserve persistence contracts: ${preservation.persistence ? "yes" : "no"}`,
    `- preserve transport contracts: ${preservation.transport ? "yes" : "no"}`,
    `- preserve configuration surface: ${preservation.configuration ? "yes" : "no"}`,
    `- preserve runtime/package boundaries: ${preservation.runtimeBoundaries ? "yes" : "no"}`,
  ].join("\n");

  return `# Refactor Analysis Summary

## Package

- name: \`${projectPackageJson.name ?? "unknown"}\`
- version: \`${projectPackageJson.version ?? "unknown"}\`
- module type: \`${projectPackageJson.type ?? "unknown"}\`
- inferred architecture: ${sourceAnalysis.architecture}

## Public Entrypoints

${renderList(publicEntrypoints)}

## Surfaces

- database-related files detected: ${sourceAnalysis.hasDatabaseSurface ? "yes" : "no"}
- transport-related files detected: ${sourceAnalysis.hasTransportSurface ? "yes" : "no"}

## Environment Variables

${renderList(sourceAnalysis.envVars.map((envVar) => `\`${envVar}\``))}

## Source Layout

- source files: ${sourceAnalysis.sourceFiles.length}
- test files: ${sourceAnalysis.testFiles.length}

## Preservation Decisions

${compatibilityNotes}
`;
}
