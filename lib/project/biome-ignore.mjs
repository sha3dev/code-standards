import path from "node:path";

import { writeTextFile } from "../utils/fs.mjs";

const DEFAULT_BIOME_IGNORE_LINES = ["node_modules", "dist", "coverage", ".code-standards"];

function buildBiomeIgnoreLines(managedFiles = []) {
  return [...new Set([...DEFAULT_BIOME_IGNORE_LINES, ...managedFiles])].sort((left, right) => left.localeCompare(right));
}

export async function ensureBiomeIgnore(targetDir, managedFiles = []) {
  const targetPath = path.join(targetDir, ".biomeignore");
  await writeTextFile(targetPath, `${buildBiomeIgnoreLines(managedFiles).join("\n")}\n`);
}
