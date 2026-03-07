import path from "node:path";

import { CODE_STANDARDS_METADATA_KEY, CONTRACT_FORMAT_VERSION } from "../constants.mjs";
import { asPlainObject, pathExists, readJsonFile, writeJsonFile } from "../utils/fs.mjs";

export function getRelativeProfilePath(profilePath, targetPath) {
  if (!profilePath) {
    return null;
  }

  const resolvedProfilePath = path.resolve(targetPath, profilePath);
  const relativePath = path.relative(targetPath, resolvedProfilePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return relativePath;
}

export async function readProjectPackageJson(targetPath) {
  const packageJsonPath = path.join(targetPath, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    throw new Error(`package.json was not found in ${targetPath}. Run refresh from the project root.`);
  }

  return { packageJsonPath, packageJson: await readJsonFile(packageJsonPath) };
}

export async function writeProjectPackageJson(packageJsonPath, packageJson) {
  await writeJsonFile(packageJsonPath, packageJson);
}

export function extractRepositoryUrl(projectPackageJson) {
  if (typeof projectPackageJson.repository === "string") {
    return projectPackageJson.repository;
  }

  const repository = asPlainObject(projectPackageJson.repository);
  return typeof repository.url === "string" ? repository.url : "";
}

export function applyPackageCoordinates(projectPackageJson, packageName, repositoryUrl) {
  return { ...projectPackageJson, name: packageName, repository: { type: "git", url: repositoryUrl } };
}

export function updateCodeStandardsMetadata(projectPackageJson, metadataPatch) {
  const existingMetadata = asPlainObject(projectPackageJson[CODE_STANDARDS_METADATA_KEY]);
  const nextMetadata = { contractVersion: CONTRACT_FORMAT_VERSION, ...existingMetadata, ...metadataPatch };

  return { ...projectPackageJson, [CODE_STANDARDS_METADATA_KEY]: nextMetadata };
}
