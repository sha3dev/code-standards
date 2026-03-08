import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MANAGED_PROJECT_SURFACE_ROOTS,
  REFACTOR_ANALYSIS_SUMMARY_PATH,
  REFACTOR_LATEST_DIR,
  REFACTOR_PRESERVATION_PATH,
  REFACTOR_PUBLIC_CONTRACT_PATH,
  isRefactorArtifactPath,
} from "../constants.mjs";
import { copyDirectoryWithFilter, removePathIfExists, writeJsonFile } from "../utils/fs.mjs";

const SNAPSHOT_IGNORED_TOP_LEVEL_NAMES = new Set(["node_modules", "dist", "coverage", ".git"]);

function shouldSkipSnapshotRelativePath(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  const topLevelName = normalizedPath.split("/")[0];

  return isRefactorArtifactPath(normalizedPath) || SNAPSHOT_IGNORED_TOP_LEVEL_NAMES.has(topLevelName);
}

export async function materializeRefactorContext(targetPath, publicContract, preservation, analysisSummary) {
  const latestReferenceDir = path.join(targetPath, REFACTOR_LATEST_DIR);

  await removePathIfExists(latestReferenceDir);
  await copyDirectoryWithFilter(targetPath, latestReferenceDir, shouldSkipSnapshotRelativePath);
  await writeJsonFile(path.join(targetPath, REFACTOR_PUBLIC_CONTRACT_PATH), publicContract);
  await writeJsonFile(path.join(targetPath, REFACTOR_PRESERVATION_PATH), preservation);
  await writeFile(path.join(targetPath, REFACTOR_ANALYSIS_SUMMARY_PATH), `${analysisSummary}\n`, "utf8");

  return {
    latestReferenceDir,
    publicContractPath: path.join(targetPath, REFACTOR_PUBLIC_CONTRACT_PATH),
    preservationPath: path.join(targetPath, REFACTOR_PRESERVATION_PATH),
    analysisSummaryPath: path.join(targetPath, REFACTOR_ANALYSIS_SUMMARY_PATH),
  };
}

export async function removeManagedProjectSurface(templateDir, targetDir) {
  const { collectTemplateFiles } = await import("../utils/fs.mjs");

  const templateFiles = await collectTemplateFiles(templateDir);
  const removableRoots = new Set(MANAGED_PROJECT_SURFACE_ROOTS);

  for (const templateFile of templateFiles) {
    if (templateFile.targetRelativePath === "package.json") {
      continue;
    }

    const normalizedPath = templateFile.targetRelativePath.split(path.sep).join("/");
    const [topLevelName] = normalizedPath.split("/");

    if (topLevelName.length > 0) {
      removableRoots.add(topLevelName);
    }
  }

  for (const rootName of removableRoots) {
    await removePathIfExists(path.join(targetDir, rootName));
  }
}
