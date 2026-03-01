import nodeConfig from "./eslint/node.mjs";
import testConfig from "./eslint/test.mjs";

export default [
  ...nodeConfig,
  ...testConfig,
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/.git/**", "**/*.md", "**/*.json"]
  }
];
