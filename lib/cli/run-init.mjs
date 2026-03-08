import path from "node:path";

import { TEMPLATE_NAMES } from "../constants.mjs";
import { loadProfileSchema, readPackageVersion, resolvePackageRoot } from "../paths.mjs";
import { resolveProfileForInit } from "../profile.mjs";
import { generateAiInstructions } from "../project/ai-instructions.mjs";
import { applyPackageCoordinates, readProjectPackageJson, updateCodeStandardsMetadata, writeProjectPackageJson } from "../project/package-metadata.mjs";
import { validateInitResources } from "../project/template-resolution.mjs";
import { copyTemplateDirectory, ensureTargetReady, runCommand } from "../utils/fs.mjs";
import { promptYesNo, withReadline } from "../utils/prompts.mjs";
import { defaultPackageNameForProject, defaultRepositoryUrlForPackage, normalizePackageName, normalizeRepositoryUrl } from "../utils/text.mjs";
import { printInitGuidance } from "./post-run-guidance.mjs";

async function promptForMissing(options, targetPath) {
  return withReadline(async (rl) => {
    const resolved = { ...options };
    const inferredProjectName = path.basename(targetPath);
    const projectName = inferredProjectName && inferredProjectName !== path.sep ? inferredProjectName : "my-project";
    const defaultPackageName = defaultPackageNameForProject(projectName);

    if (!resolved.template) {
      const templateAnswer = await rl.question("Choose template (node-lib/node-service) [node-lib]: ");
      const normalized = templateAnswer.trim() || "node-lib";

      if (!TEMPLATE_NAMES.includes(normalized)) {
        throw new Error(`Invalid template: ${normalized}`);
      }

      resolved.template = normalized;
    }

    if (!resolved.packageName) {
      const packageAnswer = await rl.question(`npm package name [${defaultPackageName}]: `);
      resolved.packageName = packageAnswer.trim() || defaultPackageName;
    }

    if (!resolved.repositoryUrl) {
      const defaultRepositoryUrl = defaultRepositoryUrlForPackage(resolved.packageName);
      const repositoryAnswer = await rl.question(`GitHub repository URL [${defaultRepositoryUrl}]: `);
      resolved.repositoryUrl = repositoryAnswer.trim() || defaultRepositoryUrl;
    }

    if (options.install) {
      const shouldInstall = await promptYesNo(rl, "Install dependencies now?", true);
      resolved.install = shouldInstall;
    }

    return resolved;
  });
}

export async function runInit(rawOptions) {
  if (rawOptions.help) {
    const { printUsage } = await import("./parse-args.mjs");
    printUsage();
    return;
  }

  let options = { ...rawOptions };
  const targetPath = path.resolve(process.cwd());
  const inferredProjectName = path.basename(targetPath);
  const projectName = inferredProjectName && inferredProjectName !== path.sep ? inferredProjectName : "my-project";
  const defaultPackageName = defaultPackageNameForProject(projectName);

  if (options.yes || !process.stdin.isTTY) {
    options.template ??= "node-lib";
    options.packageName ??= defaultPackageName;
    options.repositoryUrl ??= defaultRepositoryUrlForPackage(options.packageName);
  } else {
    options = await promptForMissing(options, targetPath);
  }

  const template = options.template ?? "node-lib";

  if (!TEMPLATE_NAMES.includes(template)) {
    throw new Error(`Invalid template: ${template}`);
  }

  const packageRoot = resolvePackageRoot();
  const packageVersion = await readPackageVersion(packageRoot);
  const schema = await loadProfileSchema(packageRoot);
  const profileResolution = await resolveProfileForInit(packageRoot, targetPath, options, schema);
  const packageName = normalizePackageName(options.packageName, projectName);
  const repositoryUrl = normalizeRepositoryUrl(options.repositoryUrl, packageName);

  await ensureTargetReady(targetPath, options.force);

  const { templateDir } = await validateInitResources(packageRoot, template);
  const tokens = { projectName, packageName, packageVersion, year: String(new Date().getFullYear()) };

  await copyTemplateDirectory(templateDir, targetPath, tokens);

  await generateAiInstructions({
    packageRoot,
    packageVersion,
    targetDir: targetPath,
    tokens,
    profile: profileResolution.profile,
    template,
    withAiAdapters: options.withAiAdapters,
  });

  if (options.install) {
    console.log("Installing dependencies...");
    await runCommand("npm", ["install"], targetPath);
  }

  const { packageJsonPath, packageJson } = await readProjectPackageJson(targetPath);
  const packageWithCoordinates = applyPackageCoordinates(packageJson, packageName, repositoryUrl);
  const packageWithMetadata = updateCodeStandardsMetadata(packageWithCoordinates, {
    template,
    profilePath: profileResolution.profilePathForMetadata,
    withAiAdapters: options.withAiAdapters,
    lastRefactorWith: packageVersion,
  });
  await writeProjectPackageJson(packageJsonPath, packageWithMetadata);

  printInitGuidance(targetPath);
}
