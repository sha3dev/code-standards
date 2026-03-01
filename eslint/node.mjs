import globals from "globals";
import baseConfig from "./base.mjs";

export default [
  ...baseConfig,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
