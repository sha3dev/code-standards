import path from "node:path";

import { TEMPLATE_NAMES } from "../constants.mjs";
import { loadProfileSchema, readPackageVersion, resolvePackageRoot } from "../paths.mjs";
import { resolveProfileForRefactor } from "../profile.mjs";
import { generateAiInstructions } from "../project/ai-instructions.mjs";
import { ensureBiomeIgnore } from "../project/biome-ignore.mjs";
import { applyManagedFiles } from "../project/managed-files.mjs";
import {
  applyPackageCoordinates,
  extractRepositoryUrl,
  readProjectPackageJson,
  refreshPackageDependencyVersions,
  updateCodeStandardsMetadata,
  writeProjectPackageJson,
} from "../project/package-metadata.mjs";
import { resolveTemplateForRefactor, validateInitResources } from "../project/template-resolution.mjs";
import { materializeRefactorContext, removeManagedProjectSurface } from "../refactor/materialize-refactor-context.mjs";
import { resolvePreservationDecisions } from "../refactor/preservation-questions.mjs";
import { extractPublicContract } from "../refactor/public-contract-extractor.mjs";
import { renderAnalysisSummary } from "../refactor/render-analysis-summary.mjs";
import { analyzeProjectSource } from "../refactor/source-analysis.mjs";
import { formatFilesWithBiome, pathExists, readJsonFile, runCommand } from "../utils/fs.mjs";
import { askChoice, withReadline } from "../utils/prompts.mjs";
import { defaultPackageNameForProject, normalizePackageName, normalizeRepositoryUrl } from "../utils/text.mjs";
import { printRefactorGuidance } from "./post-run-guidance.mjs";

async function resolveTemplate(rawOptions, projectPackageJson, targetPath) {
  try {
    return await resolveTemplateForRefactor(rawOptions, projectPackageJson, targetPath);
  } catch (_error) {
    if (rawOptions.yes || !process.stdin.isTTY) {
      return "node-lib";
    }

    return withReadline((rl) => askChoice(rl, "Choose template for refactor", TEMPLATE_NAMES, "node-lib"));
  }
}

async function readInstalledCodeStandardsVersion(targetPath) {
  const nodeModulesPath = path.join(targetPath, "node_modules");
  const installedPackagePath = path.join(nodeModulesPath, "@sha3", "code-standards", "package.json");

  if (!(await pathExists(installedPackagePath))) {
    return null;
  }

  const installedPackageJson = await readJsonFile(installedPackagePath);
  return typeof installedPackageJson.version === "string" && installedPackageJson.version.length > 0 ? installedPackageJson.version : null;
}

async function ensureDependenciesInstalled(targetPath, installRequested, packageVersion) {
  const nodeModulesPath = path.join(targetPath, "node_modules");

  if (installRequested) {
    console.log("Installing dependencies...");
    await runCommand("npm", ["install"], targetPath);
    return;
  }

  if (await pathExists(nodeModulesPath)) {
    const installedCodeStandardsVersion = await readInstalledCodeStandardsVersion(targetPath);

    if (installedCodeStandardsVersion === packageVersion) {
      return;
    }

    console.log(
      installedCodeStandardsVersion
        ? `Installing dependencies because installed @sha3/code-standards is ${installedCodeStandardsVersion} and expected ${packageVersion}...`
        : "Installing dependencies because installed @sha3/code-standards was not found in node_modules...",
    );
    await runCommand("npm", ["install"], targetPath);
    return;
  }

  console.log("Installing dependencies because node_modules is missing...");
  await runCommand("npm", ["install"], targetPath);
}

export async function runRefactor(rawOptions) {
  if (rawOptions.help) {
    const { printUsage } = await import("./parse-args.mjs");
    printUsage();
    return;
  }

  const targetPath = path.resolve(process.cwd());
  const packageRoot = resolvePackageRoot();
  const packageVersion = await readPackageVersion(packageRoot);
  const schema = await loadProfileSchema(packageRoot);
  const { packageJsonPath, packageJson: projectPackageJson } = await readProjectPackageJson(targetPath);
  const projectMetadata = projectPackageJson.codeStandards ?? {};
  const template = await resolveTemplate(rawOptions, projectPackageJson, targetPath);
  const { templateDir } = await validateInitResources(packageRoot, template);
  const profileResolution = await resolveProfileForRefactor(packageRoot, targetPath, rawOptions, schema, projectMetadata);
  const inferredProjectName = path.basename(targetPath);
  const projectName = inferredProjectName && inferredProjectName !== path.sep ? inferredProjectName : "my-project";
  const existingPackageName =
    typeof projectPackageJson.name === "string" && projectPackageJson.name.length > 0 ? projectPackageJson.name : defaultPackageNameForProject(projectName);
  const packageName = rawOptions.packageName ? normalizePackageName(rawOptions.packageName, projectName) : existingPackageName;
  const repositoryUrl = normalizeRepositoryUrl(rawOptions.repositoryUrl ?? extractRepositoryUrl(projectPackageJson), packageName);
  const tokens = { projectName, packageName, packageVersion, year: String(new Date().getFullYear()) };

  console.log("Analyzing current project...");
  const sourceAnalysis = await analyzeProjectSource(targetPath, projectPackageJson);
  const preservation = await resolvePreservationDecisions(rawOptions);
  const publicContract = extractPublicContract(projectPackageJson, template, profileResolution.profilePathForMetadata, sourceAnalysis);
  const analysisSummary = renderAnalysisSummary(projectPackageJson, sourceAnalysis, preservation);

  console.log("Creating refactor snapshot...");
  await materializeRefactorContext(targetPath, publicContract, preservation, analysisSummary);

  console.log("Rebuilding managed project surface...");
  await removeManagedProjectSurface(templateDir, targetPath);
  const managedResults = await applyManagedFiles({
    templateDir,
    targetDir: targetPath,
    tokens,
    projectPackageJson,
    dryRun: false,
  });

  const contract = await generateAiInstructions({
    packageRoot,
    packageVersion,
    targetDir: targetPath,
    tokens,
    profile: profileResolution.profile,
    template,
    withAiAdapters: rawOptions.withAiAdapters,
    workflow: "refactor",
  });
  await ensureBiomeIgnore(targetPath, contract.managedFiles);

  const packageWithCoordinates = applyPackageCoordinates(managedResults.mergedPackageJson, packageName, repositoryUrl);
  const packageWithRefreshedDependencies = await refreshPackageDependencyVersions(packageWithCoordinates, {
    cwd: targetPath,
    codeStandardsVersion: packageVersion,
  });
  const packageWithMetadata = updateCodeStandardsMetadata(packageWithRefreshedDependencies, {
    template,
    profilePath: profileResolution.profilePathForMetadata,
    withAiAdapters: rawOptions.withAiAdapters,
    lastRefactorWith: packageVersion,
  });
  await writeProjectPackageJson(packageJsonPath, packageWithMetadata);
  await formatFilesWithBiome(packageRoot, targetPath, ["package.json", "ai/contract.json"]);

  await ensureDependenciesInstalled(targetPath, rawOptions.install, packageVersion);
  await printRefactorGuidance(targetPath);
}
