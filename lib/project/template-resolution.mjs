import { constants } from "node:fs";
import { access, readdir } from "node:fs/promises";
import path from "node:path";

import { NODE_LIB_TEMPLATE_SIGNATURE, NODE_SERVICE_START_SIGNATURE, TEMPLATE_NAMES } from "../constants.mjs";
import { pathExists } from "../utils/fs.mjs";

export async function validateInitResources(packageRoot, templateName) {
  const templateDir = path.join(packageRoot, "templates", templateName);
  const agentsTemplatePath = path.join(packageRoot, "resources", "ai", "templates", "agents.project.template.md");
  const adaptersTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "adapters");
  const examplesTemplateDir = path.join(packageRoot, "resources", "ai", "templates", "examples");

  await access(templateDir, constants.R_OK);
  await access(agentsTemplatePath, constants.R_OK);
  await access(adaptersTemplateDir, constants.R_OK);
  await access(examplesTemplateDir, constants.R_OK);

  return { templateDir };
}

export async function resolveTemplateForRefactor(rawOptions, projectPackageJson, targetPath) {
  if (rawOptions.template) {
    return rawOptions.template;
  }

  const metadata = typeof projectPackageJson.codeStandards === "object" && projectPackageJson.codeStandards ? projectPackageJson.codeStandards : {};

  if (typeof metadata.template === "string" && TEMPLATE_NAMES.includes(metadata.template)) {
    return metadata.template;
  }

  const projectScripts = typeof projectPackageJson.scripts === "object" && projectPackageJson.scripts ? projectPackageJson.scripts : {};
  const startScript = typeof projectScripts.start === "string" ? projectScripts.start : "";

  if (startScript.includes(NODE_SERVICE_START_SIGNATURE)) {
    return "node-service";
  }

  const hasNodeLibSignature =
    (await pathExists(path.join(targetPath, "tsconfig.build.json"))) &&
    projectPackageJson.main === NODE_LIB_TEMPLATE_SIGNATURE.main &&
    projectPackageJson.types === NODE_LIB_TEMPLATE_SIGNATURE.types;

  if (hasNodeLibSignature) {
    return "node-lib";
  }

  throw new Error("Unable to infer template for refactor. Use --template <node-lib|node-service>.");
}

export async function listRelativeFiles(baseDir, currentDir = baseDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listRelativeFiles(baseDir, fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}
