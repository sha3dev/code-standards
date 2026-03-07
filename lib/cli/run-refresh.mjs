import path from "node:path";

import { loadProfileSchema, readPackageVersion, resolvePackageRoot } from "../paths.mjs";
import { resolveProfileForRefresh } from "../profile.mjs";
import { generateAiInstructions } from "../project/ai-instructions.mjs";
import { applyManagedFiles, collectAiFiles } from "../project/managed-files.mjs";
import {
  applyPackageCoordinates,
  extractRepositoryUrl,
  readProjectPackageJson,
  updateCodeStandardsMetadata,
  writeProjectPackageJson
} from "../project/package-metadata.mjs";
import { listRelativeFiles, resolveTemplateForRefresh, validateInitResources } from "../project/template-resolution.mjs";
import { runCommand } from "../utils/fs.mjs";
import { defaultPackageNameForProject, normalizePackageName, normalizeRepositoryUrl } from "../utils/text.mjs";

export async function runRefresh(rawOptions) {
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
  const template = await resolveTemplateForRefresh(rawOptions, projectPackageJson, targetPath);
  const { templateDir } = await validateInitResources(packageRoot, template);
  const profileResolution = await resolveProfileForRefresh(packageRoot, targetPath, rawOptions, schema, projectMetadata);
  const inferredProjectName = path.basename(targetPath);
  const projectName = inferredProjectName && inferredProjectName !== path.sep ? inferredProjectName : "my-project";
  const existingPackageName =
    typeof projectPackageJson.name === "string" && projectPackageJson.name.length > 0 ? projectPackageJson.name : defaultPackageNameForProject(projectName);
  const currentPackageName = rawOptions.packageName ? normalizePackageName(rawOptions.packageName, projectName) : existingPackageName;
  const currentRepositoryUrl = normalizeRepositoryUrl(rawOptions.repositoryUrl ?? extractRepositoryUrl(projectPackageJson), currentPackageName);
  const tokens = { projectName, packageName: currentPackageName, packageVersion, year: String(new Date().getFullYear()) };

  const managedResults = await applyManagedFiles({
    templateDir,
    targetDir: targetPath,
    tokens,
    projectPackageJson,
    dryRun: rawOptions.dryRun,
    refreshMode: true
  });
  const aiFiles = await collectAiFiles(packageRoot, rawOptions.withAiAdapters);

  if (rawOptions.dryRun) {
    const uniqueFiles = [...new Set([...managedResults.updatedFiles, ...aiFiles])].sort((left, right) => left.localeCompare(right));
    console.log(`Dry run: refresh would update ${uniqueFiles.length} file(s).`);

    for (const filePath of uniqueFiles) {
      console.log(`  - ${filePath}`);
    }

    if (rawOptions.install) {
      console.log("Dry run: npm install would be executed.");
    }

    return;
  }

  await generateAiInstructions({
    packageRoot,
    packageVersion,
    targetDir: targetPath,
    tokens,
    profile: profileResolution.profile,
    template,
    withAiAdapters: rawOptions.withAiAdapters
  });

  if (rawOptions.install) {
    console.log("Installing dependencies...");
    await runCommand("npm", ["install"], targetPath);
  }

  const packageWithCoordinates = applyPackageCoordinates(managedResults.mergedPackageJson, currentPackageName, currentRepositoryUrl);
  const packageWithMetadata = updateCodeStandardsMetadata(packageWithCoordinates, {
    template,
    profilePath: profileResolution.profilePathForMetadata,
    withAiAdapters: rawOptions.withAiAdapters,
    lastRefreshWith: packageVersion
  });
  await writeProjectPackageJson(packageJsonPath, packageWithMetadata);

  console.log("Running npm run fix...");
  await runCommand("npm", ["run", "fix"], targetPath);
  console.log("Running npm run check...");
  await runCommand("npm", ["run", "check"], targetPath);

  const currentFiles = await listRelativeFiles(targetPath);
  console.log(`Project refreshed at ${targetPath}`);
  console.log(`Refresh verification completed (${currentFiles.length} files in project).`);
}
