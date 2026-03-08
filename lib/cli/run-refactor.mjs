import path from "node:path";

import { TEMPLATE_NAMES } from "../constants.mjs";
import { loadProfileSchema, readPackageVersion, resolvePackageRoot } from "../paths.mjs";
import { resolveProfileForRefactor } from "../profile.mjs";
import { generateAiInstructions } from "../project/ai-instructions.mjs";
import { applyManagedFiles } from "../project/managed-files.mjs";
import {
  applyPackageCoordinates,
  extractRepositoryUrl,
  readProjectPackageJson,
  updateCodeStandardsMetadata,
  writeProjectPackageJson,
} from "../project/package-metadata.mjs";
import { resolveTemplateForRefactor, validateInitResources } from "../project/template-resolution.mjs";
import { materializeRefactorContext, removeManagedProjectSurface } from "../refactor/materialize-refactor-context.mjs";
import { resolvePreservationDecisions } from "../refactor/preservation-questions.mjs";
import { extractPublicContract } from "../refactor/public-contract-extractor.mjs";
import { renderAnalysisSummary } from "../refactor/render-analysis-summary.mjs";
import { analyzeProjectSource } from "../refactor/source-analysis.mjs";
import { runCommand } from "../utils/fs.mjs";
import { askChoice, withReadline } from "../utils/prompts.mjs";
import { defaultPackageNameForProject, normalizePackageName, normalizeRepositoryUrl } from "../utils/text.mjs";

async function resolveTemplate(rawOptions, projectPackageJson, targetPath) {
  try {
    return await resolveTemplateForRefactor(rawOptions, projectPackageJson, targetPath);
  } catch (error) {
    if (rawOptions.yes || !process.stdin.isTTY) {
      return "node-lib";
    }

    return withReadline((rl) => askChoice(rl, "Choose template for refactor", TEMPLATE_NAMES, "node-lib"));
  }
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

  await generateAiInstructions({
    packageRoot,
    packageVersion,
    targetDir: targetPath,
    tokens,
    profile: profileResolution.profile,
    template,
    withAiAdapters: rawOptions.withAiAdapters,
  });

  if (rawOptions.install) {
    console.log("Installing dependencies...");
    await runCommand("npm", ["install"], targetPath);
  }

  const packageWithCoordinates = applyPackageCoordinates(managedResults.mergedPackageJson, packageName, repositoryUrl);
  const packageWithMetadata = updateCodeStandardsMetadata(packageWithCoordinates, {
    template,
    profilePath: profileResolution.profilePathForMetadata,
    withAiAdapters: rawOptions.withAiAdapters,
    lastRefactorWith: packageVersion,
  });
  await writeProjectPackageJson(packageJsonPath, packageWithMetadata);

  console.log("Running npm run fix...");
  await runCommand("npm", ["run", "fix"], targetPath);
  console.log("Running npm run check...");
  await runCommand("npm", ["run", "check"], targetPath);
  console.log(`Project refactored at ${targetPath}`);
}
