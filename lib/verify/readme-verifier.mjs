import { readFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

import { README_REQUIRED_HEADINGS_BY_TEMPLATE } from "../constants.mjs";
import { createVerificationIssue } from "./issue-helpers.mjs";
import { extractPublicReadmeApi } from "./readme-public-api.mjs";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHeadingSection(readmeRaw, heading) {
  const lines = readmeRaw.split("\n");
  const headingIndex = lines.findIndex((line) => line.trim() === heading);

  if (headingIndex === -1) {
    return null;
  }

  const sectionLines = [];

  for (const line of lines.slice(headingIndex + 1)) {
    if (line.startsWith("## ") || line.startsWith("# ")) {
      break;
    }

    sectionLines.push(line);
  }

  return sectionLines.join("\n");
}

function hasExportSection(readmeRaw, exportName) {
  return readmeRaw.split("\n").some((line) => line.trim() === `### \`${exportName}\``);
}

function hasMethodSection(readmeRaw, methodName) {
  return readmeRaw.split("\n").some((line) => line.trim().startsWith(`#### \`${methodName}`));
}

function hasPackageRootImportExample(readmeRaw, packageName) {
  if (!packageName) {
    return false;
  }

  return new RegExp(`from ["']${escapeRegExp(packageName)}["']`).test(readmeRaw);
}

function hasDocumentedHttpEndpoint(readmeRaw) {
  const httpApiSection = extractHeadingSection(readmeRaw, "## HTTP API");

  if (!httpApiSection) {
    return false;
  }

  return /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b\s+\/\S*/.test(httpApiSection);
}

function collectConfigKeys(configRaw, configPath) {
  const sourceFile = ts.createSourceFile(configPath, configRaw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const keys = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "config" || !declaration.initializer) {
        continue;
      }

      const initializer = ts.isAsExpression(declaration.initializer) ? declaration.initializer.expression : declaration.initializer;
      if (!ts.isObjectLiteralExpression(initializer)) {
        continue;
      }

      for (const property of initializer.properties) {
        if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
          keys.push(property.name.text);
        }
      }
    }
  }

  return keys;
}

export async function verifyReadme(targetPath, options) {
  const { template, packageName } = options;
  const readmePath = path.join(targetPath, "README.md");
  const readmeRaw = await readFile(readmePath, "utf8");
  const configPath = path.join(targetPath, "src", "config.ts");
  const configRaw = await readFile(configPath, "utf8").catch(() => "");
  const issues = [];
  const requiredHeadings = README_REQUIRED_HEADINGS_BY_TEMPLATE[template] ?? [];

  for (const heading of requiredHeadings) {
    if (!readmeRaw.includes(heading)) {
      issues.push(
        createVerificationIssue({
          ruleId: "readme-sections",
          category: "readme",
          relativePath: "README.md",
          message: `missing required README heading: ${heading}`,
        }),
      );
    }
  }

  const publicReadmeApi = await extractPublicReadmeApi(targetPath);

  for (const exportedMember of publicReadmeApi.exports) {
    if (!hasExportSection(readmeRaw, exportedMember.exportName)) {
      issues.push(
        createVerificationIssue({
          ruleId: "readme-public-api",
          category: "readme",
          relativePath: "README.md",
          message: `missing README section for public export: ${exportedMember.exportName}`,
        }),
      );
      continue;
    }

    if (exportedMember.kind !== "class") {
      continue;
    }

    for (const publicMethod of exportedMember.publicMethods) {
      if (!hasMethodSection(readmeRaw, publicMethod)) {
        issues.push(
          createVerificationIssue({
            ruleId: "readme-public-methods",
            category: "readme",
            relativePath: "README.md",
            message: `missing README method documentation: ${exportedMember.exportName}.${publicMethod}()`,
          }),
        );
      }
    }
  }

  if (template === "node-lib" && !hasPackageRootImportExample(readmeRaw, packageName)) {
    issues.push(
      createVerificationIssue({
        ruleId: "readme-usage-examples",
        category: "readme",
        relativePath: "README.md",
        message: "README examples must show at least one import from the package root",
      }),
    );
  }

  if (template === "node-service" && !hasDocumentedHttpEndpoint(readmeRaw)) {
    issues.push(
      createVerificationIssue({
        ruleId: "readme-http-api",
        category: "readme",
        relativePath: "README.md",
        message: "README HTTP API section must document at least one endpoint with method and path",
      }),
    );
  }

  if (/\b(?:placeholder|todo|your project|lorem ipsum)\b/i.test(readmeRaw)) {
    issues.push(
      createVerificationIssue({
        ruleId: "readme-no-placeholder-language",
        category: "readme",
        relativePath: "README.md",
        message: "README contains placeholder or scaffold-like language",
        verificationMode: "heuristic",
        confidence: "medium",
      }),
    );
  }

  const configKeys = collectConfigKeys(configRaw, configPath);
  for (const configKey of configKeys) {
    if (!readmeRaw.includes(configKey)) {
      issues.push(
        createVerificationIssue({
          ruleId: "readme-config-coverage",
          category: "readme",
          relativePath: "README.md",
          message: `README must document config key: ${configKey}`,
        }),
      );
    }
  }

  const hasPlausibleCodeExample = /```(?:ts|bash)\n[\s\S]*?(?:npm |import |\bnode\b|\bconst\b)/.test(readmeRaw);
  if (!hasPlausibleCodeExample) {
    issues.push(
      createVerificationIssue({
        ruleId: "readme-runnable-examples",
        category: "readme",
        relativePath: "README.md",
        message: "README must include plausible runnable command or TypeScript examples",
        verificationMode: "heuristic",
        confidence: "medium",
      }),
    );
  }

  return issues;
}
