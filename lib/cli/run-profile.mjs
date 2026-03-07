import path from "node:path";

import { DEFAULT_PROFILE } from "../constants.mjs";
import { getBundledProfilePath, loadProfileSchema, resolvePackageRoot } from "../paths.mjs";
import { createProfileInteractively, validateProfile } from "../profile.mjs";
import { normalizeProfile, pathExists, writeJsonFile } from "../utils/fs.mjs";
import { promptYesNo, withReadline } from "../utils/prompts.mjs";

export async function runProfile(rawOptions) {
  if (rawOptions.help) {
    const { printUsage } = await import("./parse-args.mjs");
    printUsage();
    return;
  }

  const packageRoot = resolvePackageRoot();
  const schema = await loadProfileSchema(packageRoot);
  const defaultProfilePath = getBundledProfilePath(packageRoot);
  const outputPath = rawOptions.profilePath ? path.resolve(process.cwd(), rawOptions.profilePath) : defaultProfilePath;
  const shouldUseNonInteractive = rawOptions.nonInteractive || !process.stdin.isTTY;
  const exists = await pathExists(outputPath);

  if (exists && !rawOptions.forceProfile) {
    if (shouldUseNonInteractive) {
      throw new Error(`Profile already exists at ${outputPath}. Use --force-profile to overwrite.`);
    }

    const shouldOverwrite = await withReadline((rl) => promptYesNo(rl, `Profile already exists at ${outputPath}. Overwrite?`, false));
    if (!shouldOverwrite) {
      console.log("Profile update cancelled.");
      return;
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
