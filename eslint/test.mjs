import globals from "globals";
import nodeConfig from "./node.mjs";

export default [
  ...nodeConfig,
  {
    files: ["**/*.test.{js,mjs,cjs,ts,mts,cts}", "**/*.spec.{js,mjs,cjs,ts,mts,cts}", "test/**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: { ...globals.mocha, ...globals.node } }
  }
];
