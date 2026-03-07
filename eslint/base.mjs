import js from "@eslint/js";
import tseslint from "typescript-eslint";

import codeStandardsPlugin from "../lib/eslint/plugin.mjs";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/.git/**", "**/ai/examples/**", "**/resources/ai/templates/examples/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"], rules: { curly: ["error", "all"] } },
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    plugins: { "@sha3/code-standards": codeStandardsPlugin },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@sha3/code-standards/single-return": "error",
      "@sha3/code-standards/no-promise-chains": "error",
      "@sha3/code-standards/one-public-class-per-file": "error",
      "@sha3/code-standards/class-section-order": "error",
      "@sha3/code-standards/canonical-config-import": "error",
      "@sha3/code-standards/forbidden-generic-identifiers": "error",
      "@sha3/code-standards/boolean-prefix": "error",
      "@sha3/code-standards/feature-filename-role": "error"
    }
  },
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } }
);
