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
const skillsIndexTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills.index.template.md");
const featureShapingSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "feature-shaping", "SKILL.md");
const simplicityAuditSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "simplicity-audit", "SKILL.md");
const changeSynchronizationSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "change-synchronization", "SKILL.md");
const testScopeSelectionSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "test-scope-selection", "SKILL.md");
const httpApiConventionsSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "http-api-conventions", "SKILL.md");
const initSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "init-workflow", "SKILL.md");
const refactorSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "refactor-workflow", "SKILL.md");
const readmeSkillTemplatePath = path.join(repoRoot, "resources", "ai", "templates", "skills", "readme-authoring", "SKILL.md");

const [
  catalogRaw,
  catalogSchemaRaw,
  contractSchemaRaw,
  agentsTemplateRaw,
  skillsIndexTemplateRaw,
  featureShapingSkillTemplateRaw,
  simplicityAuditSkillTemplateRaw,
  changeSynchronizationSkillTemplateRaw,
  testScopeSelectionSkillTemplateRaw,
  httpApiConventionsSkillTemplateRaw,
  initSkillTemplateRaw,
  refactorSkillTemplateRaw,
  readmeSkillTemplateRaw,
] = await Promise.all([
  readFile(catalogPath, "utf8"),
  readFile(catalogSchemaPath, "utf8"),
  readFile(contractSchemaPath, "utf8"),
  readFile(agentsTemplatePath, "utf8"),
  readFile(skillsIndexTemplatePath, "utf8"),
  readFile(featureShapingSkillTemplatePath, "utf8"),
  readFile(simplicityAuditSkillTemplatePath, "utf8"),
  readFile(changeSynchronizationSkillTemplatePath, "utf8"),
  readFile(testScopeSelectionSkillTemplatePath, "utf8"),
  readFile(httpApiConventionsSkillTemplatePath, "utf8"),
  readFile(initSkillTemplatePath, "utf8"),
  readFile(refactorSkillTemplatePath, "utf8"),
  readFile(readmeSkillTemplatePath, "utf8"),
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

for (const token of ["{{contractVersion}}", "{{generatedByVersion}}", "{{deterministicRules}}", "{{heuristicRules}}", "{{auditRules}}", "{{managedFiles}}"]) {
  if (!agentsTemplateRaw.includes(token)) {
    console.error(`resources/ai/templates/agents.project.template.md is missing token ${token}`);
    process.exit(1);
  }
}

for (const [filePath, fileRaw, requiredSnippet] of [
  ["resources/ai/templates/skills.index.template.md", skillsIndexTemplateRaw, "## Default Workflow Skills"],
  ["resources/ai/templates/skills/feature-shaping/SKILL.md", featureShapingSkillTemplateRaw, "name: feature-shaping"],
  ["resources/ai/templates/skills/simplicity-audit/SKILL.md", simplicityAuditSkillTemplateRaw, "name: simplicity-audit"],
  ["resources/ai/templates/skills/change-synchronization/SKILL.md", changeSynchronizationSkillTemplateRaw, "name: change-synchronization"],
  ["resources/ai/templates/skills/test-scope-selection/SKILL.md", testScopeSelectionSkillTemplateRaw, "name: test-scope-selection"],
  ["resources/ai/templates/skills/http-api-conventions/SKILL.md", httpApiConventionsSkillTemplateRaw, "name: http-api-conventions"],
  ["resources/ai/templates/skills/init-workflow/SKILL.md", initSkillTemplateRaw, "name: init-workflow"],
  ["resources/ai/templates/skills/refactor-workflow/SKILL.md", refactorSkillTemplateRaw, "name: refactor-workflow"],
  ["resources/ai/templates/skills/readme-authoring/SKILL.md", readmeSkillTemplateRaw, "name: readme-authoring"],
]) {
  if (!fileRaw.includes(requiredSnippet)) {
    console.error(`${filePath} is missing required content: ${requiredSnippet}`);
    process.exit(1);
  }
}

console.log("ai resource validation passed");
