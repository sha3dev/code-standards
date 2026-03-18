import { TEMPLATE_NAMES } from "../constants.mjs";

export function printUsage() {
  console.log(`Usage:
  code-standards <command> [options]

Commands:
  init                  Initialize a project in the current directory
  refactor              Snapshot the current repo and rebuild it from the active scaffold
  profile               Create or update the AI style profile
  verify                Validate deterministic standards in a project

Init options:
  --template <node-lib|node-service>
  --package-name <name>
  --repository-url <url>
  --yes
  --no-install
  --force
  --with-ai-adapters
  --no-ai-adapters
  --profile <path>

Refactor options:
  --template <node-lib|node-service>
  --package-name <name>
  --repository-url <url>
  --profile <path>
  --with-ai-adapters
  --no-ai-adapters
  --install
  --yes
  --force

Verify options:
  --report <text|json>
  --only <rule-id[,rule-id...]>
  --files <path[,path...]>
  --explain <rule-id>
  --strict
  --changed-against <ref>
  --staged
  --all-files

Profile options:
  --profile <path>
  --non-interactive
  --force-profile

Global:
  -h, --help`);
}

export function parseInitArgs(argv) {
  const options = {
    template: undefined,
    packageName: undefined,
    repositoryUrl: undefined,
    yes: false,
    install: true,
    force: false,
    withAiAdapters: true,
    profilePath: undefined,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("-")) {
      throw new Error(`Positional project names are not supported: ${token}. Run init from your target directory.`);
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

    if (token === "--package-name") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --package-name");
      }
      options.packageName = value;
      i += 1;
      continue;
    }

    if (token === "--repository-url") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --repository-url");
      }
      options.repositoryUrl = value;
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

export function parseRefactorArgs(argv) {
  const options = {
    template: undefined,
    packageName: undefined,
    repositoryUrl: undefined,
    profilePath: undefined,
    withAiAdapters: true,
    install: false,
    yes: false,
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("-")) {
      throw new Error(`Positional arguments are not supported for refactor: ${token}.`);
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

    if (token === "--package-name") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --package-name");
      }
      options.packageName = value;
      i += 1;
      continue;
    }

    if (token === "--repository-url") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --repository-url");
      }
      options.repositoryUrl = value;
      i += 1;
      continue;
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

    if (token === "--with-ai-adapters") {
      options.withAiAdapters = true;
      continue;
    }

    if (token === "--no-ai-adapters") {
      options.withAiAdapters = false;
      continue;
    }

    if (token === "--install") {
      options.install = true;
      continue;
    }

    if (token === "--yes") {
      options.yes = true;
      continue;
    }

    if (token === "--force") {
      options.force = true;
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

export function parseProfileArgs(argv) {
  const options = { profilePath: undefined, nonInteractive: false, forceProfile: false, help: false };

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

export function parseVerifyArgs(argv) {
  const options = {
    report: "text",
    onlyRuleIds: undefined,
    files: undefined,
    explainRuleId: undefined,
    strict: false,
    changedAgainst: undefined,
    staged: false,
    allFiles: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--report") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --report");
      }
      if (value !== "text" && value !== "json") {
        throw new Error(`Invalid value for --report: ${value}`);
      }
      options.report = value;
      i += 1;
      continue;
    }

    if (token === "--only") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --only");
      }
      const onlyRuleIds = [
        ...new Set(
          value
            .split(",")
            .map((ruleId) => ruleId.trim())
            .filter((ruleId) => ruleId.length > 0),
        ),
      ];
      if (onlyRuleIds.length === 0) {
        throw new Error("--only requires at least one rule id");
      }
      options.onlyRuleIds = onlyRuleIds;
      i += 1;
      continue;
    }

    if (token === "--files") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --files");
      }
      const files = [
        ...new Set(
          value
            .split(",")
            .map((filePath) => filePath.trim())
            .filter((filePath) => filePath.length > 0),
        ),
      ];
      if (files.length === 0) {
        throw new Error("--files requires at least one path");
      }
      options.files = files;
      i += 1;
      continue;
    }

    if (token === "--explain") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --explain");
      }
      options.explainRuleId = value;
      i += 1;
      continue;
    }

    if (token === "--changed-against") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --changed-against");
      }
      options.changedAgainst = value;
      i += 1;
      continue;
    }

    if (token === "--strict") {
      options.strict = true;
      continue;
    }

    if (token === "--staged") {
      options.staged = true;
      continue;
    }

    if (token === "--all-files") {
      options.allFiles = true;
      continue;
    }

    if (token === "-h" || token === "--help") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  if (options.explainRuleId && (options.onlyRuleIds || options.files || options.report !== "text")) {
    throw new Error("--explain cannot be combined with --only, --files, or --report");
  }

  if (options.staged && options.allFiles) {
    throw new Error("--staged cannot be combined with --all-files");
  }

  return options;
}
