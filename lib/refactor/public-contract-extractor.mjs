export function extractPublicContract(projectPackageJson, template, profilePath, sourceAnalysis) {
  return {
    template,
    profilePath,
    package: {
      name: projectPackageJson.name ?? null,
      version: projectPackageJson.version ?? null,
      type: projectPackageJson.type ?? null,
      main: projectPackageJson.main ?? null,
      types: projectPackageJson.types ?? null,
      exports: projectPackageJson.exports ?? null,
      bin: projectPackageJson.bin ?? null,
    },
    repository: projectPackageJson.repository ?? null,
    publicEntrypoints: sourceAnalysis.entrypoints,
    compatibilitySurface: {
      hasDatabaseSurface: sourceAnalysis.hasDatabaseSurface,
      hasTransportSurface: sourceAnalysis.hasTransportSurface,
      envVars: sourceAnalysis.envVars,
    },
  };
}
