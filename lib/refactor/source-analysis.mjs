import { readFile } from "node:fs/promises";
import path from "node:path";

import { listRelativeFiles } from "../project/template-resolution.mjs";

const DATABASE_PATH_PATTERN = /(^|\/)(db|database|prisma|drizzle|sequelize|typeorm|migrations?)(\/|$)/i;
const TRANSPORT_PATH_PATTERN = /(^|\/)(http|server|routes?|controllers?|handlers?|events?|messages?)(\/|$)/i;
const ENV_VAR_PATTERN = /\bprocess\.env\.([A-Z0-9_]+)/g;

function summarizeArchitecture(files) {
  if (files.some((filePath) => filePath.startsWith("src/app/")) || files.some((filePath) => filePath.startsWith("src/http/"))) {
    return "service-oriented feature folders";
  }

  if (files.some((filePath) => filePath.startsWith("src/") && filePath.split("/").length >= 3)) {
    return "feature folders";
  }

  return "flat module layout";
}

function collectPublicEntrypoints(projectPackageJson) {
  const entrypoints = [];

  if (projectPackageJson.main) {
    entrypoints.push({ kind: "main", value: projectPackageJson.main });
  }

  if (projectPackageJson.types) {
    entrypoints.push({ kind: "types", value: projectPackageJson.types });
  }

  if (projectPackageJson.bin) {
    entrypoints.push({ kind: "bin", value: projectPackageJson.bin });
  }

  if (projectPackageJson.exports) {
    entrypoints.push({ kind: "exports", value: projectPackageJson.exports });
  }

  return entrypoints;
}

async function collectEnvVars(targetPath, files) {
  const envVars = new Set();

  for (const filePath of files.filter((candidate) => candidate.endsWith(".ts") || candidate === ".env.example")) {
    const raw = await readFile(path.join(targetPath, filePath), "utf8").catch(() => "");
    const matches = raw.matchAll(ENV_VAR_PATTERN);

    for (const match of matches) {
      envVars.add(match[1]);
    }
  }

  return [...envVars].sort((left, right) => left.localeCompare(right));
}

export async function analyzeProjectSource(targetPath, projectPackageJson) {
  const files = await listRelativeFiles(targetPath);
  const envVars = await collectEnvVars(targetPath, files);

  return {
    files,
    packageType: typeof projectPackageJson.type === "string" ? projectPackageJson.type : null,
    entrypoints: collectPublicEntrypoints(projectPackageJson),
    architecture: summarizeArchitecture(files),
    hasDatabaseSurface: files.some((filePath) => DATABASE_PATH_PATTERN.test(filePath)),
    hasTransportSurface: files.some((filePath) => TRANSPORT_PATH_PATTERN.test(filePath)),
    envVars,
    testFiles: files.filter((filePath) => filePath.startsWith("test/")),
    sourceFiles: files.filter((filePath) => filePath.startsWith("src/")),
  };
}
