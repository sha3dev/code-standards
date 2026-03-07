import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJsonFile } from "./utils/fs.mjs";

export function resolvePackageRoot() {
  const callerPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(callerPath), "..");
}

export async function readPackageVersion(packageRoot) {
  const packageJson = await readJsonFile(path.join(packageRoot, "package.json"));

  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error("Package version is missing in the CLI package.json.");
  }

  return packageJson.version;
}

export function getBundledProfilePath(packageRoot) {
  return path.join(packageRoot, "profiles", "default.profile.json");
}

export function getProfileSchemaPath(packageRoot) {
  return path.join(packageRoot, "profiles", "schema.json");
}

export function getRuleCatalogPath(packageRoot) {
  return path.join(packageRoot, "resources", "ai", "rule-catalog.json");
}

export function getRuleCatalogSchemaPath(packageRoot) {
  return path.join(packageRoot, "resources", "ai", "rule-catalog.schema.json");
}

export function getContractSchemaPath(packageRoot) {
  return path.join(packageRoot, "resources", "ai", "contract.schema.json");
}

export async function loadJsonFileAt(filePath) {
  await access(filePath, constants.R_OK);
  return readJsonFile(filePath);
}

export async function loadProfileSchema(packageRoot) {
  return loadJsonFileAt(getProfileSchemaPath(packageRoot));
}
