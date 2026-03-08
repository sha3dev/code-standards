import { readFile } from "node:fs/promises";
import path from "node:path";

import { MANAGED_AI_FILES } from "../constants.mjs";
import { collectTemplateFiles, mirrorFile } from "../utils/fs.mjs";
import { replaceTokens } from "../utils/text.mjs";
import { writeProjectPackageJson } from "./package-metadata.mjs";
import { collectPromptFiles } from "./prompt-files.mjs";

export function mergePackageJsonFromTemplate(projectPackageJson, templatePackageJson) {
  const mergedPackageJson = { ...projectPackageJson };
  const mergedDependencies = { ...(projectPackageJson.dependencies ?? {}) };
  const mergedScripts = { ...(projectPackageJson.scripts ?? {}) };
  const mergedDevDependencies = { ...(projectPackageJson.devDependencies ?? {}) };

  for (const [dependencyName, dependencyVersion] of Object.entries(templatePackageJson.dependencies ?? {})) {
    mergedDependencies[dependencyName] = dependencyVersion;
  }

  for (const [scriptName, scriptValue] of Object.entries(templatePackageJson.scripts ?? {})) {
    mergedScripts[scriptName] = scriptValue;
  }

  for (const [dependencyName, dependencyVersion] of Object.entries(templatePackageJson.devDependencies ?? {})) {
    mergedDevDependencies[dependencyName] = dependencyVersion;
  }

  mergedPackageJson.scripts = mergedScripts;
  mergedPackageJson.dependencies = mergedDependencies;
  mergedPackageJson.devDependencies = mergedDevDependencies;

  for (const key of ["type", "main", "types", "exports", "files"]) {
    if (templatePackageJson[key] !== undefined) {
      mergedPackageJson[key] = templatePackageJson[key];
    }
  }

  return mergedPackageJson;
}

export async function applyManagedFiles(options) {
  const { templateDir, targetDir, tokens, projectPackageJson, dryRun } = options;
  const templateFiles = await collectTemplateFiles(templateDir);
  const updatedFiles = [];
  let mergedPackageJson = { ...projectPackageJson };

  for (const templateFile of templateFiles) {
    if (templateFile.targetRelativePath === "package.json") {
      const templatePackageJson = JSON.parse(replaceTokens(await readFile(templateFile.sourcePath, "utf8"), tokens));
      mergedPackageJson = mergePackageJsonFromTemplate(mergedPackageJson, templatePackageJson);
      updatedFiles.push("package.json");
      continue;
    }

    updatedFiles.push(templateFile.targetRelativePath);

    if (dryRun) {
      continue;
    }

    await mirrorFile(templateFile.sourcePath, path.join(targetDir, templateFile.targetRelativePath), tokens);
  }

  if (!dryRun) {
    await writeProjectPackageJson(path.join(targetDir, "package.json"), mergedPackageJson);
  }

  return { updatedFiles, mergedPackageJson };
}

export async function collectAiFiles(packageRoot, withAiAdapters = true) {
  const { readdir } = await import("node:fs/promises");
  const aiFiles = [...MANAGED_AI_FILES];

  if (!withAiAdapters) {
    return aiFiles.sort((left, right) => left.localeCompare(right));
  }

  const adaptersTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "adapters");
  const examplesTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "examples");
  const adapterEntries = await readdir(adaptersTemplateDir, { withFileTypes: true });
  const exampleTemplateFiles = await collectTemplateFiles(examplesTemplateDir);

  for (const entry of adapterEntries) {
    if (entry.isFile() && entry.name.endsWith(".template.md")) {
      aiFiles.push(path.join("ai", entry.name.replace(/\.template\.md$/, ".md")));
    }
  }

  for (const exampleFile of exampleTemplateFiles) {
    aiFiles.push(path.join("ai", "examples", exampleFile.targetRelativePath));
  }

  return aiFiles.sort((left, right) => left.localeCompare(right));
}

export async function collectManagedFiles(packageRoot, withAiAdapters = true) {
  const [aiFiles, promptFiles] = await Promise.all([collectAiFiles(packageRoot, withAiAdapters), collectPromptFiles(packageRoot)]);
  return [...new Set([...aiFiles, ...promptFiles])].sort((left, right) => left.localeCompare(right));
}
