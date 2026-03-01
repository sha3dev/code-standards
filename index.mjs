import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import eslintBase from "./eslint/base.mjs";
import eslintNode from "./eslint/node.mjs";
import eslintTest from "./eslint/test.mjs";

const require = createRequire(import.meta.url);
const prettierConfig = require("./prettier/index.cjs");
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export { eslintBase, eslintNode, eslintTest, prettierConfig };

export const tsconfigPaths = {
  base: path.join(rootDir, "tsconfig", "base.json"),
  nodeLib: path.join(rootDir, "tsconfig", "node-lib.json"),
  nodeService: path.join(rootDir, "tsconfig", "node-service.json")
};
