import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { replaceTokens } from "../utils/text.mjs";

function buildRuleLines(rules, deterministic) {
  return rules
    .filter((rule) => rule.deterministic === deterministic)
    .map((rule) => `- \`${rule.id}\`: ${rule.summary} (${rule.enforcedBy.join(", ")})`)
    .join("\n");
}

function buildManagedFiles(managedFiles) {
  return managedFiles.map((filePath) => `- \`${filePath}\``).join("\n");
}

export async function renderProjectAgents(packageRoot, targetDir, contract) {
  const templatePath = path.join(packageRoot, "resources", "ai", "templates", "agents.project.template.md");
  const template = await readFile(templatePath, "utf8");
  const rendered = replaceTokens(template, {
    projectName: contract.project.name,
    contractVersion: contract.formatVersion,
    generatedByVersion: contract.generatedByVersion,
    profileSummary: Object.entries(contract.profile)
      .map(([key, value]) => `- \`${key}\`: \`${Array.isArray(value) ? value.join(" | ") : String(value)}\``)
      .join("\n"),
    blockingRules: buildRuleLines(contract.rules, true),
    guidanceRules: buildRuleLines(contract.rules, false),
    managedFiles: buildManagedFiles(contract.managedFiles),
  });

  await writeFile(path.join(targetDir, "AGENTS.md"), rendered, "utf8");
}

export async function renderProjectRules(packageRoot, targetDir, contract) {
  const templatePath = path.join(packageRoot, "resources", "ai", "templates", "rules.project.template.md");
  const template = await readFile(templatePath, "utf8");
  const rendered = replaceTokens(template, {
    blockingRules: buildRuleLines(contract.rules, true),
    guidanceRules: buildRuleLines(contract.rules, false),
  });

  await writeFile(path.join(targetDir, "ai", "rules.md"), rendered, "utf8");
}

export async function renderAdapterFiles(packageRoot, targetDir, tokens) {
  const adaptersTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "adapters");
  const adaptersTarget = path.join(targetDir, "ai");
  const { mkdir, readdir } = await import("node:fs/promises");

  await mkdir(adaptersTarget, { recursive: true });
  const entries = await readdir(adaptersTemplateDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".template.md")) {
      continue;
    }

    const raw = await readFile(path.join(adaptersTemplateDir, entry.name), "utf8");
    await writeFile(path.join(adaptersTarget, entry.name.replace(/\.template\.md$/, ".md")), replaceTokens(raw, tokens), "utf8");
  }
}

export async function renderExampleFiles(packageRoot, targetDir, tokens) {
  const { copyTemplateDirectory } = await import("../utils/fs.mjs");
  await copyTemplateDirectory(path.join(packageRoot, "resources", "ai", "templates", "examples"), path.join(targetDir, "ai", "examples"), tokens);
}
