export const TEMPLATE_NAMES = ["node-lib", "node-service"];
export const CODE_STANDARDS_METADATA_KEY = "codeStandards";
export const CONTRACT_FORMAT_VERSION = "v2";
export const NODE_LIB_TEMPLATE_SIGNATURE = { main: "dist/index.js", types: "dist/index.d.ts" };
export const NODE_SERVICE_START_SIGNATURE = "node --import tsx src/main.ts";
export const REFACTOR_ARTIFACT_ROOT = ".code-standards/refactor-source";
export const REFACTOR_LATEST_DIR = `${REFACTOR_ARTIFACT_ROOT}/latest`;
export const REFACTOR_PUBLIC_CONTRACT_PATH = `${REFACTOR_ARTIFACT_ROOT}/public-contract.json`;
export const REFACTOR_PRESERVATION_PATH = `${REFACTOR_ARTIFACT_ROOT}/preservation.json`;
export const REFACTOR_ANALYSIS_SUMMARY_PATH = `${REFACTOR_ARTIFACT_ROOT}/analysis-summary.md`;
export const MANAGED_PROJECT_SURFACE_ROOTS = [
  "AGENTS.md",
  "ai",
  "prompts",
  ".vscode",
  ".biomeignore",
  "biome.json",
  "README.md",
  "src",
  "test",
  "scripts",
  "tsconfig.json",
  "tsconfig.build.json",
  "ecosystem.config.cjs",
  ".gitignore",
  "eslint.config.mjs",
  "prettier.config.cjs",
];
export const TEMPLATE_REQUIRED_FILES = {
  "node-lib": ["src/config.ts", "src/package-info/package-info.service.ts", "src/index.ts", "test/package-info.test.ts"],
  "node-service": [
    "src/config.ts",
    "src/app-info/app-info.service.ts",
    "src/http/http-server.service.ts",
    "src/app/service-runtime.service.ts",
    "src/index.ts",
    "src/main.ts",
    "test/service-runtime.test.ts",
  ],
};

export const PROFILE_KEY_ORDER = [
  "version",
  "paradigm",
  "function_size_policy",
  "return_policy",
  "class_design",
  "comments_policy",
  "testing_policy",
  "architecture",
  "error_handling",
  "async_style",
  "class_file_policy",
  "type_contract_policy",
  "mutability",
  "comment_section_blocks",
  "comment_section_format",
  "comment_sections_required_when_empty",
  "if_requires_braces",
  "readme_style",
  "rule_severity_model",
  "language",
  "examples_density",
  "instruction_file_location",
];

export const DEFAULT_PROFILE = {
  version: "v2",
  paradigm: "class-first",
  function_size_policy: "max_30_lines_soft",
  return_policy: "single_return_strict_no_exceptions",
  class_design: "constructor_injection",
  comments_policy: "extensive",
  testing_policy: "tests_required_for_behavior_change",
  architecture: "feature_folders",
  error_handling: "mixed",
  async_style: "async_await_only",
  class_file_policy: "one_public_class_per_file",
  type_contract_policy: "prefer_types_over_interfaces",
  mutability: "immutability_preferred",
  comment_section_blocks: [
    "imports:externals",
    "imports:internals",
    "consts",
    "types",
    "class",
    "private:attributes",
    "protected:attributes",
    "public:properties",
    "constructor",
    "static:properties",
    "factory",
    "private:methods",
    "protected:methods",
    "public:methods",
    "static:methods",
  ],
  comment_section_format: "jsdoc-section-tag",
  comment_sections_required_when_empty: false,
  if_requires_braces: true,
  readme_style: "top-tier",
  rule_severity_model: "tiered",
  language: "english_technical",
  examples_density: "rule_with_good_bad_examples",
  instruction_file_location: "root_agents_md",
};

export const PROFILE_QUESTIONS = [
  { key: "paradigm", prompt: "Preferred paradigm", options: ["class-first", "hybrid", "functional-first"] },
  { key: "function_size_policy", prompt: "Function size policy", options: ["max_20_lines_hard", "max_30_lines_soft", "no_fixed_limit"] },
  { key: "return_policy", prompt: "Return policy", options: ["single_return_strict_no_exceptions", "single_return_with_guard_clauses", "free_return_style"] },
  { key: "class_design", prompt: "Class design policy", options: ["constructor_injection", "internal_instantiation", "mixed"] },
  { key: "comments_policy", prompt: "Comments policy", options: ["extensive", "complex_logic_only", "minimal"] },
  { key: "testing_policy", prompt: "Testing policy", options: ["tests_required_for_behavior_change", "tests_critical_only", "tests_optional"] },
  { key: "architecture", prompt: "Architecture style", options: ["feature_folders", "layered", "simple_src_lib"] },
  { key: "error_handling", prompt: "Error handling style", options: ["mixed", "exceptions_with_typed_errors", "result_either"] },
  { key: "async_style", prompt: "Async style", options: ["async_await_only", "promise_chains", "both"] },
  { key: "class_file_policy", prompt: "Class/file policy", options: ["one_public_class_per_file", "multiple_classes_allowed", "no_rule"] },
  { key: "type_contract_policy", prompt: "Type contract policy", options: ["prefer_types_over_interfaces", "interfaces_everywhere", "interfaces_public_only"] },
  { key: "mutability", prompt: "Mutability policy", options: ["immutability_preferred", "immutability_strict", "mutable_pragmatic"] },
  { key: "rule_severity_model", prompt: "Rule severity model", options: ["tiered", "all_preferred"] },
  { key: "language", prompt: "Instruction language", options: ["english_technical", "spanish_technical", "bilingual"] },
  { key: "examples_density", prompt: "Examples density", options: ["rule_with_good_bad_examples", "rules_only", "rules_plus_long_templates"] },
  { key: "instruction_file_location", prompt: "Instruction file location", options: ["root_agents_md", "ai_instructions_md", "both"] },
];

export const README_REQUIRED_HEADINGS_BY_TEMPLATE = {
  "node-lib": [
    "## TL;DR",
    "## Why",
    "## Main Capabilities",
    "## Installation",
    "## Usage",
    "## Examples",
    "## Public API",
    "## Configuration",
    "## Compatibility",
    "## Scripts",
    "## Structure",
    "## Troubleshooting",
    "## AI Workflow",
  ],
  "node-service": [
    "## TL;DR",
    "## Why",
    "## Main Capabilities",
    "## Installation",
    "## Running Locally",
    "## Usage",
    "## Examples",
    "## Public API",
    "## Configuration",
    "## Compatibility",
    "## Scripts",
    "## Structure",
    "## Troubleshooting",
    "## AI Workflow",
  ],
};

export const MANAGED_AI_FILES = ["AGENTS.md", "ai/contract.json", "ai/rules.md"];
export const AI_ADAPTER_FILES = ["codex.md", "cursor.md", "copilot.md", "windsurf.md"];

export function isRefactorArtifactPath(relativePath) {
  const normalizedPath = relativePath.split("\\").join("/");
  return normalizedPath === REFACTOR_ARTIFACT_ROOT || normalizedPath.startsWith(`${REFACTOR_ARTIFACT_ROOT}/`);
}
