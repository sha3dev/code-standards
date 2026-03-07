import { getContractSchemaPath, getRuleCatalogPath, getRuleCatalogSchemaPath, loadJsonFileAt } from "../paths.mjs";
import { validateAgainstSchema } from "../utils/fs.mjs";

export async function loadRuleCatalog(packageRoot) {
  const [catalog, schema] = await Promise.all([loadJsonFileAt(getRuleCatalogPath(packageRoot)), loadJsonFileAt(getRuleCatalogSchemaPath(packageRoot))]);
  validateAgainstSchema(catalog, schema, "resources/ai/rule-catalog.json");
  return catalog;
}

export async function loadContractSchema(packageRoot) {
  return loadJsonFileAt(getContractSchemaPath(packageRoot));
}
