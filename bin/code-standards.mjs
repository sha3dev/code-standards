#!/usr/bin/env node

import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const TEMPLATE_NAMES = ["node-lib", "node-service"];
const PROFILE_KEY_ORDER = [
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
  "instruction_file_location"
];

const DEFAULT_PROFILE = {
  version: "v1",
  paradigm: "class-first",
  function_size_policy: "max_30_lines_soft",
  return_policy: "single_return_strict_no_exceptions",
  class_design: "constructor_injection",
  comments_policy: "extensive",
  testing_policy: "tests_required_for_behavior_change",
  architecture: "feature_folders",
  error_handling: "exceptions_with_typed_errors",
  async_style: "async_await_only",
  class_file_policy: "one_public_class_per_file",
  type_contract_policy: "prefer_types_over_interfaces",
  mutability: "immutability_preferred",
  comment_section_blocks: [
    "imports:externals",
    "imports:internals",
    "consts",
    "types",
    "private:attributes",
    "private:properties",
    "public:properties",
    "constructor",
    "static:properties",
    "factory",
    "private:methods",
    "public:methods",
    "static:methods"
  ],
  comment_section_format: "jsdoc-section-tag",
  comment_sections_required_when_empty: true,
  if_requires_braces: true,
  readme_style: "top-tier",
  rule_severity_model: "all_blocking",
  language: "english_technical",
  examples_density: "rule_with_good_bad_examples",
  instruction_file_location: "root_agents_md"
};

const PROFILE_QUESTIONS = [
  {
    key: "paradigm",
    prompt: "Preferred paradigm",
    options: ["class-first", "hybrid", "functional-first"]
  },
  {
    key: "function_size_policy",
    prompt: "Function size policy",
    options: ["max_20_lines_hard", "max_30_lines_soft", "no_fixed_limit"]
  },
  {
    key: "return_policy",
    prompt: "Return policy",
    options: [
      "single_return_strict_no_exceptions",
      "single_return_with_guard_clauses",
      "free_return_style"
    ]
  },
  {
    key: "class_design",
    prompt: "Class design policy",
    options: ["constructor_injection", "internal_instantiation", "mixed"]
  },
  {
    key: "comments_policy",
    prompt: "Comments policy",
    options: ["extensive", "complex_logic_only", "minimal"]
  },
  {
    key: "testing_policy",
    prompt: "Testing policy",
    options: ["tests_required_for_behavior_change", "tests_critical_only", "tests_optional"]
  },
  {
    key: "architecture",
    prompt: "Architecture style",
    options: ["feature_folders", "layered", "simple_src_lib"]
  },
  {
    key: "error_handling",
    prompt: "Error handling style",
    options: ["exceptions_with_typed_errors", "result_either", "mixed"]
  },
  {
    key: "async_style",
    prompt: "Async style",
    options: ["async_await_only", "promise_chains", "both"]
  },
  {
    key: "class_file_policy",
    prompt: "Class/file policy",
    options: ["one_public_class_per_file", "multiple_classes_allowed", "no_rule"]
  },
  {
    key: "type_contract_policy",
    prompt: "Type contract policy",
    options: ["prefer_types_over_interfaces", "interfaces_everywhere", "interfaces_public_only"]
  },
  {
    key: "mutability",
    prompt: "Mutability policy",
    options: ["immutability_preferred", "immutability_strict", "mutable_pragmatic"]
  },
  {
    key: "rule_severity_model",
    prompt: "Rule severity model",
    options: ["all_blocking", "tiered", "all_preferred"]
  },
  {
    key: "language",
    prompt: "Instruction language",
    options: ["english_technical", "spanish_technical", "bilingual"]
  },
  {
    key: "examples_density",
    prompt: "Examples density",
    options: ["rule_with_good_bad_examples", "rules_only", "rules_plus_long_templates"]
  },
  {
    key: "instruction_file_location",
    prompt: "Instruction file location",
    options: ["root_agents_md", "ai_instructions_md", "both"]
  }
];

function printUsage() {
  console.log(`Usage:
  code-standards <command> [options]

Commands:
  init                  Initialize a project in the current directory
  profile               Create or update the AI style profile

Init options:
  --template <node-lib|node-service>
  --yes
  --no-install
  --force
  --with-ai-adapters
  --no-ai-adapters
  --profile <path>

Profile options:
  --profile <path>
  --non-interactive
  --force-profile

Global:
  -h, --help`);
}

function parseInitArgs(argv) {
  const options = {
    template: undefined,
    yes: false,
    install: true,
    force: false,
    withAiAdapters: true,
    profilePath: undefined,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("-")) {
      throw new Error(
        `Positional project names are not supported: ${token}. Run init from your target directory.`
      );
    }

    if (token === "--template") {
      const value = argv[i + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --template");
      }

      if (!TEMPLATE_NAMES.includes(value)) {
        throw new Error(`Invalid template: ${value}`);
      }

      options.template = value;
      i += 1;
      continue;
    }

    if (token === "--target") {
      throw new Error("--target is not supported. Run init from your target directory.");
    }

    if (token === "--profile") {
      const value = argv[i + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --profile");
      }

      options.profilePath = value;
      i += 1;
      continue;
    }

    if (token === "--yes") {
      options.yes = true;
      continue;
    }

    if (token === "--no-install") {
      options.install = false;
      continue;
    }

    if (token === "--force") {
      options.force = true;
      continue;
    }

    if (token === "--with-ai-adapters") {
      options.withAiAdapters = true;
      continue;
    }

    if (token === "--no-ai-adapters") {
      options.withAiAdapters = false;
      continue;
    }

    if (token === "-h" || token === "--help") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return options;
}

function parseProfileArgs(argv) {
  const options = {
    profilePath: undefined,
    nonInteractive: false,
    forceProfile: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--profile") {
      const value = argv[i + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --profile");
      }

      options.profilePath = value;
      i += 1;
      continue;
    }

    if (token === "--non-interactive") {
      options.nonInteractive = true;
      continue;
    }

    if (token === "--force-profile") {
      options.forceProfile = true;
      continue;
    }

    if (token === "-h" || token === "--help") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return options;
}

function sanitizePackageName(input) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-project"
  );
}

function replaceTokens(content, tokens) {
  let output = content;

  for (const [key, value] of Object.entries(tokens)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }

  return output;
}

function mapTemplateFileName(fileName) {
  // npm may rewrite .gitignore to .npmignore in published tarballs.
  if (fileName === "gitignore" || fileName === ".npmignore") {
    return ".gitignore";
  }

  return fileName;
}

function normalizeProfile(rawProfile) {
  const normalized = {};

  for (const key of PROFILE_KEY_ORDER) {
    normalized[key] = rawProfile[key];
  }

  return normalized;
}

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJsonFile(filePath, value) {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureTargetReady(targetPath, force) {
  const exists = await pathExists(targetPath);

  if (!exists) {
    await mkdir(targetPath, { recursive: true });
    return;
  }

  const fileStat = await stat(targetPath);

  if (!fileStat.isDirectory()) {
    throw new Error(`Target exists and is not a directory: ${targetPath}`);
  }

  const entries = await readdir(targetPath);

  if (entries.length > 0 && !force) {
    throw new Error(
      `Target directory is not empty: ${targetPath}. Use --force to continue and overwrite files.`
    );
  }
}

async function copyTemplateDirectory(sourceDir, targetDir, tokens) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      const targetPath = path.join(targetDir, entry.name);
      await copyTemplateDirectory(sourcePath, targetPath, tokens);
      continue;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    const raw = await readFile(sourcePath, "utf8");
    const rendered = replaceTokens(raw, tokens);
    const targetName = mapTemplateFileName(entry.name);
    const targetPath = path.join(targetDir, targetName);
    await writeFile(targetPath, rendered, "utf8");
  }
}

function resolvePackageRoot() {
  const binPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(binPath), "..");
}

function getBundledProfilePath(packageRoot) {
  return path.join(packageRoot, "profiles", "default.profile.json");
}

function getProfileSchemaPath(packageRoot) {
  return path.join(packageRoot, "profiles", "schema.json");
}

async function loadProfileSchema(packageRoot) {
  const schemaPath = getProfileSchemaPath(packageRoot);
  await access(schemaPath, constants.R_OK);
  return readJsonFile(schemaPath);
}

function validateProfile(profile, schema, sourceLabel) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  const valid = validate(profile);

  if (valid) {
    return;
  }

  const details = (validate.errors ?? [])
    .map((issue) => `${issue.instancePath || "/"}: ${issue.message ?? "invalid"}`)
    .join("; ");

  throw new Error(`Invalid profile at ${sourceLabel}: ${details}`);
}

async function readAndValidateProfile(profilePath, schema) {
  const profile = await readJsonFile(profilePath);
  validateProfile(profile, schema, profilePath);
  return normalizeProfile(profile);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function askChoice(rl, prompt, options, defaultValue) {
  const defaultIndex = options.indexOf(defaultValue);

  if (defaultIndex < 0) {
    throw new Error(`Invalid default value for question ${prompt}`);
  }

  console.log(`\n${prompt}`);

  for (let index = 0; index < options.length; index += 1) {
    console.log(`  ${index + 1}) ${options[index]}`);
  }

  const answer = await rl.question(`Select option [${defaultIndex + 1}]: `);
  const normalized = answer.trim();

  if (normalized.length === 0) {
    return defaultValue;
  }

  const numeric = Number.parseInt(normalized, 10);

  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
    return options[numeric - 1];
  }

  if (options.includes(normalized)) {
    return normalized;
  }

  throw new Error(`Invalid option for ${prompt}: ${answer}`);
}

async function promptYesNo(rl, prompt, defaultYes = true) {
  const suffix = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = (await rl.question(`${prompt} ${suffix}: `)).trim().toLowerCase();

  if (answer.length === 0) {
    return defaultYes;
  }

  if (answer === "y" || answer === "yes") {
    return true;
  }

  if (answer === "n" || answer === "no") {
    return false;
  }

  throw new Error(`Invalid yes/no answer: ${answer}`);
}

async function createProfileInteractively(baseProfile) {
  const profile = { ...baseProfile };
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    for (const question of PROFILE_QUESTIONS) {
      profile[question.key] = await askChoice(
        rl,
        question.prompt,
        question.options,
        profile[question.key]
      );
    }
  } finally {
    rl.close();
  }

  return normalizeProfile(profile);
}

async function runProfile(rawOptions) {
  if (rawOptions.help) {
    printUsage();
    return;
  }

  const packageRoot = resolvePackageRoot();
  const schema = await loadProfileSchema(packageRoot);
  const defaultProfilePath = getBundledProfilePath(packageRoot);
  const outputPath = rawOptions.profilePath
    ? path.resolve(process.cwd(), rawOptions.profilePath)
    : defaultProfilePath;
  const shouldUseNonInteractive = rawOptions.nonInteractive || !process.stdin.isTTY;
  const exists = await pathExists(outputPath);

  if (exists && !rawOptions.forceProfile) {
    if (shouldUseNonInteractive) {
      throw new Error(`Profile already exists at ${outputPath}. Use --force-profile to overwrite.`);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      const shouldOverwrite = await promptYesNo(
        rl,
        `Profile already exists at ${outputPath}. Overwrite?`,
        false
      );

      if (!shouldOverwrite) {
        console.log("Profile update cancelled.");
        return;
      }
    } finally {
      rl.close();
    }
  }

  let profile = normalizeProfile(DEFAULT_PROFILE);

  if (shouldUseNonInteractive) {
    validateProfile(profile, schema, "built-in defaults");
  } else {
    profile = await createProfileInteractively(profile);
    validateProfile(profile, schema, "interactive answers");
  }

  await writeJsonFile(outputPath, profile);
  console.log(`Profile written to ${outputPath}`);
}

function buildProfileSummary(profile) {
  return [
    `- Paradigm: \`${profile.paradigm}\``,
    `- Function size policy: \`${profile.function_size_policy}\``,
    `- Return policy: \`${profile.return_policy}\``,
    `- Class design: \`${profile.class_design}\``,
    `- Comments policy: \`${profile.comments_policy}\``,
    `- Testing policy: \`${profile.testing_policy}\``,
    `- Architecture: \`${profile.architecture}\``,
    `- Error handling: \`${profile.error_handling}\``,
    `- Async style: \`${profile.async_style}\``,
    `- Class file policy: \`${profile.class_file_policy}\``,
    `- Type contracts: \`${profile.type_contract_policy}\``,
    `- Mutability: \`${profile.mutability}\``,
    `- Comment section blocks: \`${profile.comment_section_blocks.join(" | ")}\``,
    `- Comment section format: \`${profile.comment_section_format}\``,
    `- Empty section blocks required: \`${String(profile.comment_sections_required_when_empty)}\``,
    `- If statements require braces: \`${String(profile.if_requires_braces)}\``,
    `- README style: \`${profile.readme_style}\``,
    `- Rule severity: \`${profile.rule_severity_model}\``,
    `- Language: \`${profile.language}\``,
    `- Examples: \`${profile.examples_density}\``
  ].join("\n");
}

function buildAlternativeRules(profile) {
  const codeRules = [];

  if (profile.paradigm !== "class-first") {
    codeRules.push(
      "### Paradigm Override (MUST)\n\n" +
        `- The active paradigm is \`${profile.paradigm}\` and MUST be followed consistently.\n` +
        "- Any class usage MUST be explicitly justified in comments."
    );
  }

  if (profile.return_policy !== "single_return_strict_no_exceptions") {
    codeRules.push(
      "### Return Policy Override (MUST)\n\n" +
        `- The active return policy is \`${profile.return_policy}\` and MUST be respected for all new functions.`
    );
  }

  if (profile.function_size_policy !== "max_30_lines_soft") {
    codeRules.push(
      "### Function Size Override (MUST)\n\n" +
        `- The active function-size policy is \`${profile.function_size_policy}\` and MUST be enforced.`
    );
  }

  if (profile.error_handling !== "exceptions_with_typed_errors") {
    codeRules.push(
      "### Error Handling Override (MUST)\n\n" +
        `- The active error-handling policy is \`${profile.error_handling}\`.`
    );
  }

  if (profile.async_style !== "async_await_only") {
    codeRules.push(
      "### Async Style Override (MUST)\n\n" +
        `- The active async policy is \`${profile.async_style}\` and MUST be followed in new code.`
    );
  }

  let architectureRule = "";
  if (profile.architecture !== "feature_folders") {
    architectureRule =
      "### Architecture Override (MUST)\n\n" +
      `- The active architecture is \`${profile.architecture}\` and MUST take precedence.`;
  }

  let testingRule = "";
  if (profile.testing_policy !== "tests_required_for_behavior_change") {
    testingRule =
      "### Testing Override (MUST)\n\n" +
      `- The active testing policy is \`${profile.testing_policy}\`.`;
  }

  return {
    codeRules,
    architectureRule,
    testingRule
  };
}

async function buildRuleSections(packageRoot, profile) {
  const baseRulesDir = path.join(packageRoot, "resources", "ai", "templates", "rules");

  const readRule = async (fileName) => {
    const fullPath = path.join(baseRulesDir, fileName);
    return readFile(fullPath, "utf8");
  };

  const classRule = await readRule("class-first.md");
  const functionRule = await readRule("functions.md");
  const returnRule = await readRule("returns.md");
  const controlFlowRule = await readRule("control-flow.md");
  const errorRule = await readRule("errors.md");
  const asyncRule = await readRule("async.md");
  const architectureRule = await readRule("architecture.md");
  const testingRule = await readRule("testing.md");
  const readmeRule = await readRule("readme.md");

  const alternatives = buildAlternativeRules(profile);
  const codeGenerationRules = [
    classRule,
    functionRule,
    returnRule,
    controlFlowRule,
    errorRule,
    asyncRule
  ];

  if (alternatives.codeRules.length > 0) {
    codeGenerationRules.push(...alternatives.codeRules);
  }

  return {
    codeGenerationRules: codeGenerationRules.join("\n\n"),
    architectureRules: alternatives.architectureRule || architectureRule,
    testingReviewRules: `${alternatives.testingRule || testingRule}\n\n${readmeRule}`
  };
}

async function renderProjectAgents(packageRoot, targetDir, projectName, profile) {
  const templatePath = path.join(
    packageRoot,
    "resources",
    "ai",
    "templates",
    "agents.project.template.md"
  );
  const template = await readFile(templatePath, "utf8");
  const sections = await buildRuleSections(packageRoot, profile);

  const rendered = replaceTokens(template, {
    projectName,
    profileSummary: buildProfileSummary(profile),
    codeGenerationRules: sections.codeGenerationRules,
    architectureRules: sections.architectureRules,
    testingReviewRules: sections.testingReviewRules,
    assistantExecutionNotes:
      "All assistant-specific adapter files in `ai/*.md` MUST remain aligned with these rules. " +
      "Before finalizing code generation, assistants MUST run `npm run check`."
  });

  const agentsTarget = path.join(targetDir, "AGENTS.md");
  await writeFile(agentsTarget, rendered, "utf8");
}

async function renderAdapterFiles(packageRoot, targetDir, tokens) {
  const adaptersTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "adapters");
  const adaptersTarget = path.join(targetDir, "ai");
  await mkdir(adaptersTarget, { recursive: true });

  const entries = await readdir(adaptersTemplateDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".template.md")) {
      continue;
    }

    const sourcePath = path.join(adaptersTemplateDir, entry.name);
    const outputName = entry.name.replace(/\.template\.md$/, ".md");
    const targetPath = path.join(adaptersTarget, outputName);
    const raw = await readFile(sourcePath, "utf8");
    await writeFile(targetPath, replaceTokens(raw, tokens), "utf8");
  }
}

async function renderExampleFiles(packageRoot, targetDir, tokens) {
  const examplesTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "examples");
  const examplesTarget = path.join(targetDir, "ai", "examples");
  await copyTemplateDirectory(examplesTemplateDir, examplesTarget, tokens);
}

async function generateAiInstructions(packageRoot, targetDir, tokens, profile) {
  await renderProjectAgents(packageRoot, targetDir, tokens.projectName, profile);
  await renderAdapterFiles(packageRoot, targetDir, tokens);
  await renderExampleFiles(packageRoot, targetDir, tokens);
}

async function maybeInitializeProfileInteractively(packageRoot, profilePath) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const shouldInit = await promptYesNo(
      rl,
      `Profile not found at ${profilePath}. Initialize it with package defaults?`,
      true
    );

    if (!shouldInit) {
      throw new Error("Profile initialization declined by user.");
    }
  } finally {
    rl.close();
  }

  await mkdir(path.dirname(profilePath), { recursive: true });
  await copyFile(getBundledProfilePath(packageRoot), profilePath);
  console.log(`Profile initialized at ${profilePath}`);
}

async function resolveProfileForInit(packageRoot, rawOptions, schema) {
  const bundledProfilePath = getBundledProfilePath(packageRoot);

  if (!rawOptions.profilePath) {
    const bundledExists = await pathExists(bundledProfilePath);

    if (!bundledExists) {
      if (rawOptions.yes) {
        validateProfile(DEFAULT_PROFILE, schema, "hardcoded defaults");
        return normalizeProfile(DEFAULT_PROFILE);
      }

      await writeJsonFile(bundledProfilePath, normalizeProfile(DEFAULT_PROFILE));
    }

    return readAndValidateProfile(bundledProfilePath, schema);
  }

  const requestedPath = path.resolve(process.cwd(), rawOptions.profilePath);
  const requestedExists = await pathExists(requestedPath);

  if (!requestedExists) {
    if (rawOptions.yes) {
      const bundledExists = await pathExists(bundledProfilePath);

      if (bundledExists) {
        return readAndValidateProfile(bundledProfilePath, schema);
      }

      validateProfile(DEFAULT_PROFILE, schema, "hardcoded defaults");
      return normalizeProfile(DEFAULT_PROFILE);
    }

    await maybeInitializeProfileInteractively(packageRoot, requestedPath);
  }

  return readAndValidateProfile(requestedPath, schema);
}

async function promptForMissing(options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const resolved = { ...options };

    if (!resolved.template) {
      const templateAnswer = await rl.question(
        "Choose template (node-lib/node-service) [node-lib]: "
      );
      const normalized = templateAnswer.trim() || "node-lib";

      if (!TEMPLATE_NAMES.includes(normalized)) {
        throw new Error(`Invalid template: ${normalized}`);
      }

      resolved.template = normalized;
    }

    if (options.install) {
      const installAnswer = await rl.question("Install dependencies now? (Y/n): ");
      const normalized = installAnswer.trim().toLowerCase();
      resolved.install = !(normalized === "n" || normalized === "no");
    }

    return resolved;
  } finally {
    rl.close();
  }
}

async function validateInitResources(packageRoot, templateName) {
  const templateDir = path.join(packageRoot, "templates", templateName);
  const agentsTemplatePath = path.join(
    packageRoot,
    "resources",
    "ai",
    "templates",
    "agents.project.template.md"
  );
  const adaptersTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "adapters");
  const examplesTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "examples");

  await access(templateDir, constants.R_OK);
  await access(agentsTemplatePath, constants.R_OK);
  await access(adaptersTemplateDir, constants.R_OK);
  await access(examplesTemplateDir, constants.R_OK);

  return { templateDir };
}

async function runInit(rawOptions) {
  if (rawOptions.help) {
    printUsage();
    return;
  }

  let options = { ...rawOptions };

  if (options.yes) {
    options.template ??= "node-lib";
  } else {
    options = await promptForMissing(options);
  }

  const template = options.template ?? "node-lib";

  if (!TEMPLATE_NAMES.includes(template)) {
    throw new Error(`Invalid template: ${template}`);
  }

  const packageRoot = resolvePackageRoot();
  const schema = await loadProfileSchema(packageRoot);
  const profile = await resolveProfileForInit(packageRoot, options, schema);

  const targetPath = path.resolve(process.cwd());
  const inferredProjectName = path.basename(targetPath);
  const projectName =
    inferredProjectName && inferredProjectName !== path.sep ? inferredProjectName : "my-project";
  const packageName = sanitizePackageName(projectName);

  await ensureTargetReady(targetPath, options.force);

  const { templateDir } = await validateInitResources(packageRoot, template);
  const tokens = {
    projectName,
    packageName,
    year: String(new Date().getFullYear()),
    profileSummary: JSON.stringify(profile)
  };

  await copyTemplateDirectory(templateDir, targetPath, tokens);

  if (options.withAiAdapters) {
    await generateAiInstructions(packageRoot, targetPath, tokens, profile);
  }

  if (options.install) {
    console.log("Installing dependencies...");
    await runCommand("npm", ["install"], targetPath);
  }

  console.log(`Project created at ${targetPath}`);
  console.log("Next steps:");
  console.log("  npm run check");
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    printUsage();
    process.exit(0);
  }

  const [command, ...rest] = argv;

  try {
    if (command === "init") {
      await runInit(parseInitArgs(rest));
      return;
    }

    if (command === "profile") {
      await runProfile(parseProfileArgs(rest));
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
