#!/usr/bin/env node

import { parseInitArgs, parseProfileArgs, parseRefactorArgs, parseVerifyArgs, printUsage } from "../lib/cli/parse-args.mjs";
import { runInit } from "../lib/cli/run-init.mjs";
import { runProfile } from "../lib/cli/run-profile.mjs";
import { runRefactor } from "../lib/cli/run-refactor.mjs";
import { runVerify } from "../lib/cli/run-verify.mjs";

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

    if (command === "refactor") {
      await runRefactor(parseRefactorArgs(rest));
      return;
    }

    if (command === "profile") {
      await runProfile(parseProfileArgs(rest));
      return;
    }

    if (command === "verify") {
      await runVerify(parseVerifyArgs(rest));
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
