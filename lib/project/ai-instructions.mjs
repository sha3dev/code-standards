import { renderProjectAgents, renderAdapterFiles, renderExampleFiles } from "../contract/render-agents.mjs";
import { renderContractJson } from "../contract/render-contract-json.mjs";
import { loadRuleCatalog } from "../contract/load-rule-catalog.mjs";
import { resolveContract } from "../contract/resolve-contract.mjs";
import { collectAiFiles } from "./managed-files.mjs";

export async function generateAiInstructions(options) {
  const { packageRoot, packageVersion, targetDir, tokens, profile, template, withAiAdapters } = options;
  const ruleCatalog = await loadRuleCatalog(packageRoot);
  const managedFiles = await collectAiFiles(packageRoot, withAiAdapters);
  const contract = resolveContract({ packageVersion, projectName: tokens.projectName, template, profile, withAiAdapters, managedFiles, ruleCatalog });

  await renderContractJson(targetDir, contract);
  await renderProjectAgents(packageRoot, targetDir, contract);

  if (withAiAdapters) {
    await renderAdapterFiles(packageRoot, targetDir, tokens);
    await renderExampleFiles(packageRoot, targetDir, tokens);
  }

  return contract;
}
