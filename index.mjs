import path from "node:path";
import { fileURLToPath } from "node:url";
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export const tsconfigPaths = {
  base: path.join(rootDir, "tsconfig", "base.json"),
  nodeLib: path.join(rootDir, "tsconfig", "node-lib.json"),
  nodeService: path.join(rootDir, "tsconfig", "node-service.json"),
};

export const biomeConfigPath = path.join(rootDir, "biome.json");
