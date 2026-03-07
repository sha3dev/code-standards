import { TEMPLATE_NAMES } from "../constants.mjs";

export function printUsage() {
  console.log(`Usage:
  code-standards <command> [options]

Commands:
  init                  Initialize a project in the current directory
  refresh               Re-apply managed standards files and AI instructions
  update                Alias of refresh
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

Refresh options:
  --template <node-lib|node-service>
  --package-name <name>
  --repository-url <url>
  --profile <path>
  --with-ai-adapters
  --no-ai-adapters
  --dry-run
  --install
  --yes

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
    help: false
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

export function parseRefreshArgs(argv) {
  const options = {
    template: undefined,
    packageName: undefined,
    repositoryUrl: undefined,
    profilePath: undefined,
    withAiAdapters: true,
    dryRun: false,
    install: false,
    yes: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("-")) {
      throw new Error(`Positional arguments are not supported for refresh: ${token}.`);
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

    if (token === "--dry-run") {
      options.dryRun = true;
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
  const options = { help: false };

  for (const token of argv) {
    if (token === "-h" || token === "--help") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return options;
}
