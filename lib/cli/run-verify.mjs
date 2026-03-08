import { loadRuleCatalog } from "../contract/load-rule-catalog.mjs";
import { resolvePackageRoot } from "../paths.mjs";
import { explainRule } from "../verify/explain-rule.mjs";
import { PROJECT_VERIFY_RULE_IDS } from "../verify/issue-helpers.mjs";
import { verifyProject } from "../verify/project-verifier.mjs";
import { renderJsonReport } from "../verify/render-json-report.mjs";
import { renderTextReport } from "../verify/render-text-report.mjs";

export async function runVerify(rawOptions) {
  if (rawOptions.help) {
    const { printUsage } = await import("./parse-args.mjs");
    printUsage();
    return;
  }

  const packageRoot = resolvePackageRoot();
  const ruleCatalog = await loadRuleCatalog(packageRoot);

  if (rawOptions.explainRuleId) {
    const rule = ruleCatalog.rules.find((candidate) => candidate.id === rawOptions.explainRuleId);

    if (!rule) {
      throw new Error(`Unknown rule id for --explain: ${rawOptions.explainRuleId}`);
    }

    console.log(explainRule(rule));
    return;
  }

  if (rawOptions.onlyRuleIds) {
    const knownRuleIds = new Set([...PROJECT_VERIFY_RULE_IDS, ...ruleCatalog.rules.map((rule) => rule.id)]);

    for (const ruleId of rawOptions.onlyRuleIds) {
      if (!knownRuleIds.has(ruleId)) {
        throw new Error(`Unknown rule id for --only: ${ruleId}`);
      }
    }
  }

  const targetPath = process.cwd();
  const result = await verifyProject(targetPath, {
    onlyRuleIds: rawOptions.onlyRuleIds,
    files: rawOptions.files,
  });

  if (rawOptions.report === "json") {
    console.log(renderJsonReport(result));
    if (!result.ok) {
      throw new Error(`Verification failed with ${result.summary.issueCount} issue(s).`);
    }
    return;
  }

  const output = renderTextReport(result);

  if (result.ok) {
    console.log(output);
    return;
  }

  console.error(output);
  throw new Error(`Verification failed with ${result.summary.issueCount} issue(s).`);
}
