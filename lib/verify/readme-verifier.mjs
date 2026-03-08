import { readFile } from "node:fs/promises";
import path from "node:path";

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

export async function verifyReadme(targetPath, options) {
  const { template, packageName } = options;
  const readmePath = path.join(targetPath, "README.md");
  const readmeRaw = await readFile(readmePath, "utf8");
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

  return issues;
}
