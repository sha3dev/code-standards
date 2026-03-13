import path from "node:path";

import ts from "typescript";

import { createVerificationIssue, shouldRunRule } from "./issue-helpers.mjs";
import { resolveImportRelativePath } from "./source-analysis.mjs";

const RESERVED_ROOT_SOURCE_FILES = new Set(["config.ts", "index.ts", "logger.ts", "main.ts"]);
const RESERVED_FEATURE_FOLDERS = new Set(["app", "shared", "http", "public", "internal"]);
const AMBIGUOUS_FILE_BASENAMES = new Set(["helper", "helpers", "util", "utils", "common"]);
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getActiveRuleIds(contract) {
  return new Set(contract.rules.filter((rule) => rule.blocking).map((rule) => rule.id));
}

function getFeatureSegments(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  return normalizedPath.split("/");
}

function createIssue(ruleId, relativePath, message, options = {}) {
  return createVerificationIssue({
    ruleId,
    category: "project-layout",
    relativePath,
    message,
    verificationMode: options.verificationMode,
    confidence: options.confidence,
    evidence: options.evidence,
    suggestion: options.suggestion,
  });
}

function collectSharedConsumers(sourceFiles) {
  const consumers = new Set();

  for (const file of sourceFiles) {
    if (!file.relativePath.startsWith("src/") || !file.featureName || file.featureName === "shared") {
      continue;
    }

    for (const statement of file.ast.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue;
      }

      const importedPath = resolveImportRelativePath(file.relativePath, statement.moduleSpecifier.text);
      if (importedPath?.startsWith("src/shared/")) {
        consumers.add(file.featureName);
      }
    }
  }

  return consumers;
}

function collectExportedTypeCount(file) {
  let exportedTypeCount = 0;

  for (const statement of file.ast.statements) {
    if (
      (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isEnumDeclaration(statement)) &&
      Array.isArray(statement.modifiers) &&
      statement.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exportedTypeCount += 1;
    }
  }

  return exportedTypeCount;
}

export async function verifyProjectLayout(_targetPath, contract, analysisContext, options = {}) {
  const activeRuleIds = getActiveRuleIds(contract);
  const issues = [];
  const files = analysisContext.sourceFiles.map((file) => file.relativePath);
  const sharedConsumers = collectSharedConsumers(analysisContext.sourceFiles);
  const featureEntrypoints = new Set(
    files.filter((relativePath) => relativePath.startsWith("src/") && relativePath.endsWith("/index.ts")).map((relativePath) => relativePath.split("/")[1]),
  );

  for (const relativePath of files) {
    const normalizedPath = relativePath.split(path.sep).join("/");
    const segments = getFeatureSegments(relativePath);
    const fileName = segments.at(-1);
    const fileBaseName = fileName.replace(/\.ts$/, "");

    if (
      (normalizedPath.startsWith("src/") || normalizedPath.startsWith("test/")) &&
      shouldRunRule(options.onlyRuleIds, "kebab-case-paths") &&
      activeRuleIds.has("kebab-case-paths")
    ) {
      for (const segment of segments.slice(1)) {
        const segmentBaseName = segment
          .replace(/\.test\.ts$/, "")
          .replace(/\.ts$/, "")
          .replace(/\.[a-z]+$/, "");
        if (!segmentBaseName || RESERVED_ROOT_SOURCE_FILES.has(segment) || RESERVED_FEATURE_FOLDERS.has(segmentBaseName)) {
          continue;
        }

        if (!KEBAB_CASE_PATTERN.test(segmentBaseName)) {
          issues.push(createIssue("kebab-case-paths", relativePath, `path segment must use kebab-case: ${segment}`));
        }
      }
    }

    if (
      normalizedPath.startsWith("src/") &&
      segments.length === 2 &&
      !RESERVED_ROOT_SOURCE_FILES.has(fileName) &&
      shouldRunRule(options.onlyRuleIds, "feature-first-layout") &&
      activeRuleIds.has("feature-first-layout")
    ) {
      issues.push(
        createIssue("feature-first-layout", relativePath, "src/ root should only keep entrypoints and shared scaffold files when feature folders exist", {
          verificationMode: "heuristic",
          confidence: "medium",
        }),
      );
    }

    if (
      normalizedPath.startsWith("src/") &&
      segments.length >= 3 &&
      shouldRunRule(options.onlyRuleIds, "ambiguous-feature-filenames") &&
      activeRuleIds.has("ambiguous-feature-filenames")
    ) {
      const baseWithoutRole = fileBaseName.split(".")[0];
      if (AMBIGUOUS_FILE_BASENAMES.has(baseWithoutRole)) {
        issues.push(createIssue("ambiguous-feature-filenames", relativePath, `ambiguous feature filename is forbidden: ${fileName}`));
      }
    }

    if (
      normalizedPath.startsWith("test/") &&
      shouldRunRule(options.onlyRuleIds, "test-file-naming") &&
      activeRuleIds.has("test-file-naming") &&
      !normalizedPath.endsWith(".test.ts")
    ) {
      issues.push(createIssue("test-file-naming", relativePath, "test files must use the .test.ts suffix"));
    }
  }

  if (shouldRunRule(options.onlyRuleIds, "singular-feature-folders") && activeRuleIds.has("singular-feature-folders")) {
    const featureFolders = new Set(
      files
        .filter((relativePath) => relativePath.startsWith("src/"))
        .map((relativePath) => relativePath.split("/")[1])
        .filter((segment) => segment && !RESERVED_FEATURE_FOLDERS.has(segment) && !segment.endsWith(".ts")),
    );

    for (const featureFolder of featureFolders) {
      if (featureFolder.endsWith("s")) {
        issues.push(createIssue("singular-feature-folders", `src/${featureFolder}`, `feature folders must be singular: ${featureFolder}`));
      }
    }
  }

  if (shouldRunRule(options.onlyRuleIds, "restricted-shared-boundaries") && activeRuleIds.has("restricted-shared-boundaries")) {
    if (files.some((relativePath) => relativePath.startsWith("src/shared/")) && sharedConsumers.size < 2) {
      issues.push(
        createIssue("restricted-shared-boundaries", "src/shared", "src/shared should exist only when at least two features consume it", {
          verificationMode: "heuristic",
          confidence: "medium",
          evidence: `${sharedConsumers.size} feature consumer(s) found`,
        }),
      );
    }

    if (files.some((relativePath) => relativePath.startsWith("src/app/"))) {
      const hasCompositionSurface = files.some(
        (relativePath) => relativePath.startsWith("src/app/") && /(runtime|bootstrap|compose|wiring|container|module|app)\./.test(relativePath),
      );

      if (!hasCompositionSurface) {
        issues.push(
          createIssue("restricted-shared-boundaries", "src/app", "src/app should be reserved for real composition and wiring concerns", {
            verificationMode: "heuristic",
            confidence: "medium",
          }),
        );
      }
    }
  }

  if (
    (shouldRunRule(options.onlyRuleIds, "cross-feature-entrypoint-imports") && activeRuleIds.has("cross-feature-entrypoint-imports")) ||
    (shouldRunRule(options.onlyRuleIds, "types-file-justification") && activeRuleIds.has("types-file-justification"))
  ) {
    for (const file of analysisContext.sourceFiles) {
      if (!file.relativePath.startsWith("src/")) {
        continue;
      }

      for (const statement of file.ast.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
          continue;
        }

        const importedRelativePath = resolveImportRelativePath(file.relativePath, statement.moduleSpecifier.text);
        if (!importedRelativePath?.startsWith("src/")) {
          continue;
        }

        const importedSegments = importedRelativePath.split("/");
        const importedFeatureName = importedSegments[1];
        const targetFileName = importedSegments.at(-1);

        if (
          shouldRunRule(options.onlyRuleIds, "cross-feature-entrypoint-imports") &&
          activeRuleIds.has("cross-feature-entrypoint-imports") &&
          file.featureName &&
          importedFeatureName &&
          file.featureName !== importedFeatureName &&
          featureEntrypoints.has(importedFeatureName) &&
          !RESERVED_FEATURE_FOLDERS.has(importedFeatureName) &&
          !RESERVED_ROOT_SOURCE_FILES.has(targetFileName) &&
          targetFileName !== "index.ts"
        ) {
          issues.push(
            createIssue(
              "cross-feature-entrypoint-imports",
              file.relativePath,
              `cross-feature import must go through ${importedFeatureName}/index.ts instead of ${importedRelativePath}`,
            ),
          );
        }
      }

      if (
        shouldRunRule(options.onlyRuleIds, "types-file-justification") &&
        activeRuleIds.has("types-file-justification") &&
        file.relativePath.endsWith(".types.ts")
      ) {
        const exportedTypeCount = collectExportedTypeCount(file);
        const externalImportCount = analysisContext.sourceFiles.filter(
          (candidate) => candidate.relativePath !== file.relativePath && candidate.raw.includes(`"${path.posix.basename(file.relativePath, ".ts")}.ts"`),
        ).length;

        if (exportedTypeCount <= 1 && externalImportCount === 0) {
          issues.push(
            createIssue("types-file-justification", file.relativePath, ".types.ts should be reserved for substantial shared feature types", {
              verificationMode: "heuristic",
              confidence: "medium",
              evidence: `${exportedTypeCount} exported type(s), ${externalImportCount} external import(s)`,
            }),
          );
        }
      }
    }
  }

  return issues;
}
