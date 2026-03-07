import path from "node:path";

import { collectTemplateFiles } from "../utils/fs.mjs";
import { copyDirectoryWithFilter, removePathIfExists, writeJsonFile } from "../utils/fs.mjs";

const SNAPSHOT_ROOT = ".code-standards/reference";
const SNAPSHOT_LATEST_DIR = `${SNAPSHOT_ROOT}/latest`;
const SNAPSHOT_PUBLIC_CONTRACT_PATH = `${SNAPSHOT_ROOT}/public-contract.json`;

const SNAPSHOT_IGNORED_TOP_LEVEL_NAMES = new Set(["node_modules", "dist", "coverage", ".git"]);

function shouldSkipSnapshotRelativePath(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  const topLevelName = normalizedPath.split("/")[0];

  return normalizedPath.startsWith(SNAPSHOT_ROOT) || SNAPSHOT_IGNORED_TOP_LEVEL_NAMES.has(topLevelName);
}

function buildPublicContractSnapshot(projectPackageJson, template, profilePath) {
  return {
    template,
    profilePath,
    package: {
      name: projectPackageJson.name ?? null,
      version: projectPackageJson.version ?? null,
      type: projectPackageJson.type ?? null,
      main: projectPackageJson.main ?? null,
      types: projectPackageJson.types ?? null,
      exports: projectPackageJson.exports ?? null,
      bin: projectPackageJson.bin ?? null
    },
    repository: projectPackageJson.repository ?? null
  };
}

export async function createRefreshReference(targetPath, projectPackageJson, template, profilePath) {
  const latestReferenceDir = path.join(targetPath, SNAPSHOT_LATEST_DIR);

  await removePathIfExists(latestReferenceDir);
  await copyDirectoryWithFilter(targetPath, latestReferenceDir, shouldSkipSnapshotRelativePath);
  await writeJsonFile(path.join(targetPath, SNAPSHOT_PUBLIC_CONTRACT_PATH), buildPublicContractSnapshot(projectPackageJson, template, profilePath));

  return { latestReferenceDir, publicContractPath: path.join(targetPath, SNAPSHOT_PUBLIC_CONTRACT_PATH) };
}

export async function removeTemplateManagedSurface(templateDir, targetDir) {
  const templateFiles = await collectTemplateFiles(templateDir);
  const removableRoots = new Set();

  for (const templateFile of templateFiles) {
    if (templateFile.targetRelativePath === "package.json") {
      continue;
    }

    const normalizedPath = templateFile.targetRelativePath.split(path.sep).join("/");
    const [topLevelName] = normalizedPath.split("/");

    if (topLevelName === "." || topLevelName.length === 0) {
      continue;
    }

    removableRoots.add(topLevelName);
  }

  for (const rootName of removableRoots) {
    await removePathIfExists(path.join(targetDir, rootName));
  }
}
