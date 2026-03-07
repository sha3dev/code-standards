import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const catalogPath = path.join(repoRoot, "resources", "ai", "rule-catalog.json");
const catalogSchemaPath = path.join(repoRoot, "resources", "ai", "rule-catalog.schema.json");
const contractSchemaPath = path.join(repoRoot, "resources", "ai", "contract.schema.json");
const agentsTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "agents.project.template.md");

const [catalogRaw, catalogSchemaRaw, contractSchemaRaw, agentsTemplateRaw] = await Promise.all([
  readFile(catalogPath, "utf8"),
  readFile(catalogSchemaPath, "utf8"),
  readFile(contractSchemaPath, "utf8"),
  readFile(agentsTemplatePath, "utf8")
]);

const catalog = JSON.parse(catalogRaw);
const catalogSchema = JSON.parse(catalogSchemaRaw);
const contractSchema = JSON.parse(contractSchemaRaw);
const ajv = new Ajv2020({ allErrors: true, strict: true });

const validateCatalog = ajv.compile(catalogSchema);

if (!validateCatalog(catalog)) {
  console.error("resources/ai/rule-catalog.json does not match resources/ai/rule-catalog.schema.json");

  for (const issue of validateCatalog.errors ?? []) {
    console.error(`- ${issue.instancePath || "/"}: ${issue.message ?? "invalid"}`);
  }

  process.exit(1);
}

if (!contractSchema || typeof contractSchema !== "object" || !("properties" in contractSchema)) {
  console.error("resources/ai/contract.schema.json is not a valid schema-like object");
  process.exit(1);
}

for (const rule of catalog.rules) {
  for (const examplePath of [...rule.examples.good, ...rule.examples.bad]) {
    await access(path.join(repoRoot, "resources", "ai", "templates", examplePath.replace(/^ai\/examples\//, "examples/")));
  }
}

for (const token of ["{{contractVersion}}", "{{generatedByVersion}}", "{{blockingRules}}", "{{guidanceRules}}", "{{managedFiles}}"]) {
  if (!agentsTemplateRaw.includes(token)) {
    console.error(`resources/ai/templates/agents.project.template.md is missing token ${token}`);
    process.exit(1);
  }
}

console.log("ai resource validation passed");
