import { loadRuleCatalog } from "../contract/load-rule-catalog.mjs";
import { renderAdapterFiles, renderExampleFiles, renderProjectAgents } from "../contract/render-agents.mjs";
import { renderContractJson } from "../contract/render-contract-json.mjs";
import { resolveContract } from "../contract/resolve-contract.mjs";
import { collectManagedFiles } from "./managed-files.mjs";
import { renderPromptFiles } from "./prompt-files.mjs";

export async function generateAiInstructions(options) {
  const { packageRoot, packageVersion, targetDir, tokens, profile, template, withAiAdapters } = options;
  const ruleCatalog = await loadRuleCatalog(packageRoot);
  const managedFiles = await collectManagedFiles(packageRoot, withAiAdapters);
  const contract = resolveContract({ packageVersion, projectName: tokens.projectName, template, profile, withAiAdapters, managedFiles, ruleCatalog });

  await renderContractJson(targetDir, contract);
  await renderProjectAgents(packageRoot, targetDir, contract);
  await renderPromptFiles(packageRoot, targetDir, tokens);

  if (withAiAdapters) {
    await renderAdapterFiles(packageRoot, targetDir, tokens);
    await renderExampleFiles(packageRoot, targetDir, tokens);
  }

  return contract;
}
