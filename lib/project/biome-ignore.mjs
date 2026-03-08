import path from "node:path";

import { writeTextFile } from "../utils/fs.mjs";

const BIOME_IGNORE_LINES = ["node_modules", "dist", "coverage", ".code-standards"];

export async function ensureBiomeIgnore(targetDir) {
  const targetPath = path.join(targetDir, ".biomeignore");
  await writeTextFile(targetPath, `${BIOME_IGNORE_LINES.join("\n")}\n`);
}
