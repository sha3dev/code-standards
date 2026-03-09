import { CONTRACT_FORMAT_VERSION } from "../constants.mjs";

function matchesProfileOverride(rule, profile) {
  const overrides = rule.profileOverrides ?? [];

  if (overrides.length === 0) {
    return true;
  }

  return overrides.every((override) => {
    if (override.equals !== undefined) {
      return profile[override.key] === override.equals;
    }

    if (Array.isArray(override.oneOf)) {
      return override.oneOf.includes(profile[override.key]);
    }

    return true;
  });
}

export function resolveContract(options) {
  const { packageVersion, projectName, template, profile, withAiAdapters, managedFiles, ruleCatalog } = options;
  const activeRules = ruleCatalog.rules
    .filter((rule) => matchesProfileOverride(rule, profile))
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      summary: rule.summary,
      severity: rule.severity,
      kind: rule.kind,
      deterministic: rule.verificationMode === "deterministic",
      verificationMode: rule.verificationMode,
      verificationSource: rule.verificationSource,
      blocking: rule.blocking,
      implementedBy: rule.implementedBy,
      requiresContext: rule.requiresContext,
      confidence: rule.confidence,
      appliesTo: rule.appliesTo,
      enforcedBy: rule.enforcedBy,
      examples: rule.examples,
    }));

  return {
    formatVersion: CONTRACT_FORMAT_VERSION,
    generatedByVersion: packageVersion,
    project: { name: projectName, template, withAiAdapters },
    profile,
    managedFiles,
    rules: activeRules,
  };
}
