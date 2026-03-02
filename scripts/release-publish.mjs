import { access, readFile } from "node:fs/promises";
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

function runCapture(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function readPackageJson(packageJsonPath) {
  const raw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(raw);
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    return null;
  }

  return { major: Number.parseInt(match[1], 10), minor: Number.parseInt(match[2], 10), patch: Number.parseInt(match[3], 10) };
}

function predictMinorBump(version) {
  const parsed = parseVersion(version);

  if (!parsed) {
    return null;
  }

  return `${parsed.major}.${parsed.minor + 1}.0`;
}

function isNotFoundError(output) {
  const lower = output.toLowerCase();
  return lower.includes("e404") || lower.includes("404 not found") || lower.includes("no match found");
}

async function versionExistsOnRegistry(packageName, version, cwd) {
  const result = await runCapture("npm", ["view", `${packageName}@${version}`, "version", "--json"], cwd);
  const combinedOutput = `${result.stdout}\n${result.stderr}`;

  if (result.code === 0) {
    return true;
  }

  if (isNotFoundError(combinedOutput)) {
    return false;
  }

  throw new Error(`Unable to verify npm registry version for ${packageName}@${version}: ${combinedOutput.trim()}`);
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
  let packageJson = await readPackageJson(packageJsonPath);

  if (typeof packageJson.name !== "string" || packageJson.name.length === 0) {
    throw new Error("package.json name is required.");
  }

  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error("package.json version is required.");
  }

  if (!options.skipChecks) {
    if (options.dryRun) {
      console.log("[dry-run] npm run release:check");
    } else {
      await run("npm", ["run", "release:check"], repoRoot);
    }
  }

  const publishedVersionExists = await versionExistsOnRegistry(packageJson.name, packageJson.version, repoRoot);

  if (publishedVersionExists) {
    const predictedNextVersion = predictMinorBump(packageJson.version);
    console.log(
      `Version ${packageJson.version} already exists on npm. ` + `Minor bump will be applied${predictedNextVersion ? ` (${predictedNextVersion})` : ""}.`
    );

    if (options.dryRun) {
      console.log("[dry-run] npm version minor --no-git-tag-version");
    } else {
      await run("npm", ["version", "minor", "--no-git-tag-version"], repoRoot);
      packageJson = await readPackageJson(packageJsonPath);
      console.log(`Version updated to ${packageJson.version}`);
    }
  } else {
    console.log(`Version ${packageJson.version} is not published yet. Using package.json version as-is.`);
  }

  const publishArgs = ["publish", "--access", options.access];

  if (options.tag) {
    publishArgs.push("--tag", options.tag);
  }

  if (options.dryRun) {
    publishArgs.push("--dry-run");
  }

  console.log(`Publishing ${packageJson.name}@${packageJson.version} from repository root`);

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
