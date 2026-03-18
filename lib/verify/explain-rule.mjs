function renderProfileOverrides(profileOverrides) {
  if (!profileOverrides || profileOverrides.length === 0) {
    return "- none";
  }

  return profileOverrides
    .map((override) => {
      if (override.equals !== undefined) {
        return `- ${override.key} == ${String(override.equals)}`;
      }

      if (Array.isArray(override.oneOf)) {
        return `- ${override.key} in [${override.oneOf.map((value) => String(value)).join(", ")}]`;
      }

      return `- ${override.key}`;
    })
    .join("\n");
}

function renderExamples(label, examples) {
  if (!examples || examples.length === 0) {
    return `${label}:\n- none`;
  }

  return `${label}:\n${examples.map((examplePath) => `- ${examplePath}`).join("\n")}`;
}

export function explainRule(rule) {
  return `Rule: ${rule.id}
Title: ${rule.title}
Summary: ${rule.summary}
Kind: ${rule.kind}
Severity: ${rule.severity}
Deterministic: ${rule.deterministic ? "yes" : "no"}
Verification mode: ${rule.verificationMode}
Verification source: ${rule.verificationSource}
Confidence: ${rule.confidence}
Applies to:
${rule.appliesTo.map((pattern) => `- ${pattern}`).join("\n")}

Enforced by:
${rule.enforcedBy.map((enforcedBy) => `- ${enforcedBy}`).join("\n")}

Implemented by:
${(rule.implementedBy ?? []).map((implementedBy) => `- ${implementedBy}`).join("\n")}

Profile overrides:
${renderProfileOverrides(rule.profileOverrides)}

Examples:
${renderExamples("Good", rule.examples.good)}
${renderExamples("Bad", rule.examples.bad)}`;
}
