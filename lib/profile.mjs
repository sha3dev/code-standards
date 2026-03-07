import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { DEFAULT_PROFILE, PROFILE_QUESTIONS } from "./constants.mjs";
import { getBundledProfilePath } from "./paths.mjs";
import { getRelativeProfilePath } from "./project/package-metadata.mjs";
import { normalizeProfile, pathExists, readJsonFile, validateAgainstSchema, writeJsonFile } from "./utils/fs.mjs";
import { askChoice, promptYesNo, withReadline } from "./utils/prompts.mjs";

export function validateProfile(profile, schema, sourceLabel) {
  validateAgainstSchema(profile, schema, sourceLabel);
}

export async function readAndValidateProfile(profilePath, schema) {
  const profile = await readJsonFile(profilePath);
  validateProfile(profile, schema, profilePath);
  return normalizeProfile(profile);
}

export async function createProfileInteractively(baseProfile) {
  return withReadline(async (rl) => {
    const profile = { ...baseProfile };

    for (const question of PROFILE_QUESTIONS) {
      profile[question.key] = await askChoice(rl, question.prompt, question.options, profile[question.key]);
    }

    return normalizeProfile(profile);
  });
}

export async function maybeInitializeProfileInteractively(packageRoot, profilePath) {
  const shouldInit = await withReadline((rl) => promptYesNo(rl, `Profile not found at ${profilePath}. Initialize it with package defaults?`, true));

  if (!shouldInit) {
    throw new Error("Profile initialization declined by user.");
  }

  await mkdir(path.dirname(profilePath), { recursive: true });
  await copyFile(getBundledProfilePath(packageRoot), profilePath);
  console.log(`Profile initialized at ${profilePath}`);
}

export async function resolveBundledOrDefaultProfile(packageRoot, schema) {
  const bundledProfilePath = getBundledProfilePath(packageRoot);

  if (await pathExists(bundledProfilePath)) {
    return { profile: await readAndValidateProfile(bundledProfilePath, schema), profilePathForMetadata: null };
  }

  validateProfile(DEFAULT_PROFILE, schema, "hardcoded defaults");
  return { profile: normalizeProfile(DEFAULT_PROFILE), profilePathForMetadata: null };
}

export async function resolveProfileForInit(packageRoot, targetPath, rawOptions, schema) {
  const bundledProfilePath = getBundledProfilePath(packageRoot);

  if (!rawOptions.profilePath) {
    if (!(await pathExists(bundledProfilePath))) {
      if (rawOptions.yes) {
        return resolveBundledOrDefaultProfile(packageRoot, schema);
      }

      await writeJsonFile(bundledProfilePath, normalizeProfile(DEFAULT_PROFILE));
    }

    return { profile: await readAndValidateProfile(bundledProfilePath, schema), profilePathForMetadata: null };
  }

  const requestedPath = path.resolve(targetPath, rawOptions.profilePath);

  if (!(await pathExists(requestedPath))) {
    if (rawOptions.yes) {
      return resolveBundledOrDefaultProfile(packageRoot, schema);
    }

    await maybeInitializeProfileInteractively(packageRoot, requestedPath);
  }

  return { profile: await readAndValidateProfile(requestedPath, schema), profilePathForMetadata: getRelativeProfilePath(requestedPath, targetPath) };
}

export async function resolveProfileForRefresh(packageRoot, targetPath, rawOptions, schema, projectMetadata) {
  let selectedProfilePath;

  if (rawOptions.profilePath) {
    selectedProfilePath = path.resolve(targetPath, rawOptions.profilePath);
  } else if (typeof projectMetadata.profilePath === "string" && projectMetadata.profilePath.trim().length > 0) {
    selectedProfilePath = path.resolve(targetPath, projectMetadata.profilePath);
  }

  if (!selectedProfilePath) {
    return resolveBundledOrDefaultProfile(packageRoot, schema);
  }

  if (!(await pathExists(selectedProfilePath))) {
    if (rawOptions.yes) {
      return resolveBundledOrDefaultProfile(packageRoot, schema);
    }

    await maybeInitializeProfileInteractively(packageRoot, selectedProfilePath);
  }

  return {
    profile: await readAndValidateProfile(selectedProfilePath, schema),
    profilePathForMetadata: getRelativeProfilePath(selectedProfilePath, targetPath)
  };
}
