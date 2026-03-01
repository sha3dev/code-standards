import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const options = { dryRun: false, access: "public", tag: undefined, skipChecks: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (token === "--skip-checks") {
      options.skipChecks = true;
      continue;
    }

    if (token === "--access") {
      const value = argv[i + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --access");
      }

      options.access = value;
      i += 1;
      continue;
    }

    if (token === "--tag") {
      const value = argv[i + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --tag");
      }

      options.tag = value;
      i += 1;
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

function printUsage() {
  console.log(`Usage:
  npm run release:publish -- [options]

Options:
  --dry-run       Print publish command without executing
  --skip-checks   Skip npm run release:check
  --access <val>  npm publish access (default: public)
  --tag <tag>     npm dist-tag to publish under
  -h, --help`);
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const packageJsonPath = path.join(repoRoot, "package.json");

  await access(packageJsonPath, constants.R_OK);

  if (!options.skipChecks) {
    if (options.dryRun) {
      console.log("[dry-run] npm run release:check");
    } else {
      await run("npm", ["run", "release:check"], repoRoot);
    }
  }

  const publishArgs = ["publish", "--access", options.access];

  if (options.tag) {
    publishArgs.push("--tag", options.tag);
  }

  if (options.dryRun) {
    publishArgs.push("--dry-run");
  }

  console.log("Publishing @sha3/code-standards from repository root");

  if (options.dryRun) {
    console.log(`[dry-run] npm ${publishArgs.join(" ")} (cwd: .)`);
    return;
  }

  await run("npm", publishArgs, repoRoot);
  console.log("Release publish completed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
