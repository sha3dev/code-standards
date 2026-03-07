import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

import { PROFILE_KEY_ORDER } from "../constants.mjs";
import { mapTemplateFileName, replaceTokens } from "./text.mjs";

export async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function writeJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function pathExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureTargetReady(targetPath, force) {
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
  const nonGitEntries = entries.filter((entry) => entry !== ".git");

  if (nonGitEntries.length > 0 && !force) {
    throw new Error(`Target directory is not empty: ${targetPath}. Use --force to continue and overwrite files.`);
  }
}

export async function collectTemplateFiles(templateDir, baseDir = templateDir) {
  const entries = await readdir(templateDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const sourcePath = path.join(templateDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTemplateFiles(sourcePath, baseDir)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const sourceRelativePath = path.relative(baseDir, sourcePath);
    const sourceDirectory = path.dirname(sourceRelativePath);
    const sourceFileName = path.basename(sourceRelativePath);
    const mappedFileName = mapTemplateFileName(sourceFileName);
    const targetRelativePath = sourceDirectory === "." ? mappedFileName : path.join(sourceDirectory, mappedFileName);

    files.push({ sourcePath, sourceRelativePath, targetRelativePath });
  }

  return files.sort((left, right) => left.targetRelativePath.localeCompare(right.targetRelativePath));
}

export async function copyTemplateDirectory(sourceDir, targetDir, tokens) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      await copyTemplateDirectory(sourcePath, path.join(targetDir, entry.name), tokens);
      continue;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    const raw = await readFile(sourcePath, "utf8");
    const targetName = mapTemplateFileName(entry.name);
    const targetPath = path.join(targetDir, targetName);
    await writeFile(targetPath, replaceTokens(raw, tokens), "utf8");
  }
}

export async function mirrorFile(sourcePath, targetPath, tokens) {
  const raw = await readFile(sourcePath, "utf8");
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, replaceTokens(raw, tokens), "utf8");
}

export function asPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

export function normalizeProfile(rawProfile) {
  const normalized = {};

  for (const key of PROFILE_KEY_ORDER) {
    normalized[key] = rawProfile[key];
  }

  return normalized;
}

export function validateAgainstSchema(value, schema, sourceLabel) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  const valid = validate(value);

  if (valid) {
    return;
  }

  const details = (validate.errors ?? []).map((issue) => `${issue.instancePath || "/"}: ${issue.message ?? "invalid"}`).join("; ");
  throw new Error(`Invalid data at ${sourceLabel}: ${details}`);
}

export async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

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

export async function copyFileIfExists(sourcePath, targetPath) {
  if (!(await pathExists(sourcePath))) {
    return;
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}
