import { spawn } from "node:child_process";
import path from "node:path";

import { CODE_STANDARDS_METADATA_KEY, CONTRACT_FORMAT_VERSION } from "../constants.mjs";
import { asPlainObject, pathExists, readJsonFile, writeJsonFile } from "../utils/fs.mjs";

const OBSOLETE_METADATA_KEYS = ["lastRefreshWith"];

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
    throw new Error(`package.json was not found in ${targetPath}. Run refactor from the project root.`);
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
  const nextMetadata = { ...existingMetadata, ...metadataPatch, contractVersion: CONTRACT_FORMAT_VERSION };

  for (const metadataKey of OBSOLETE_METADATA_KEYS) {
    delete nextMetadata[metadataKey];
  }

  return { ...projectPackageJson, [CODE_STANDARDS_METADATA_KEY]: nextMetadata };
}

function isRegistryDependencyRange(versionRange) {
  return typeof versionRange === "string" && versionRange.length > 0 && !/^(workspace:|file:|link:|git\+|https?:|github:|npm:)/.test(versionRange);
}

function getVersionPrefix(versionRange) {
  const match = versionRange.match(/^([\^~])/);
  return match ? match[1] : "";
}

async function readLatestPublishedVersion(packageName, cwd) {
  return new Promise((resolve) => {
    const child = spawn("npm", ["view", packageName, "version", "--json"], {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      shell: process.platform === "win32",
    });
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.on("error", () => resolve(null));
    child.on("exit", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(typeof parsed === "string" && parsed.length > 0 ? parsed : null);
      } catch {
        resolve(null);
      }
    });
  });
}

async function refreshDependencyBlock(dependencies, options) {
  const refreshedDependencies = { ...dependencies };
  const resolveLatestVersion = options.resolveLatestVersion ?? ((dependencyName) => readLatestPublishedVersion(dependencyName, options.cwd));

  for (const [dependencyName, versionRange] of Object.entries(dependencies ?? {})) {
    if (dependencyName === "@sha3/code-standards") {
      refreshedDependencies[dependencyName] = `${getVersionPrefix(versionRange)}${options.codeStandardsVersion}`;
      continue;
    }

    if (!isRegistryDependencyRange(versionRange)) {
      continue;
    }

    const latestPublishedVersion = await resolveLatestVersion(dependencyName);
    if (!latestPublishedVersion) {
      continue;
    }

    refreshedDependencies[dependencyName] = `${getVersionPrefix(versionRange)}${latestPublishedVersion}`;
  }

  return refreshedDependencies;
}

export async function refreshPackageDependencyVersions(projectPackageJson, options) {
  return {
    ...projectPackageJson,
    dependencies: await refreshDependencyBlock(projectPackageJson.dependencies, options),
    devDependencies: await refreshDependencyBlock(projectPackageJson.devDependencies, options),
  };
}
