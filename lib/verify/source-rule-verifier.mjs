import path from "node:path";

import ts from "typescript";

import { createVerificationIssue, getActiveVerifyRuleIds, shouldRunRule } from "./issue-helpers.mjs";
import { getIdentifierText, isExportedClass, loadProjectSourceFiles, visitNodes, visitNonNestedStatements } from "./source-analysis.mjs";

const FORBIDDEN_IDENTIFIER_NAMES = new Set(["data", "obj", "tmp", "val", "thing", "helper", "utils", "common"]);
const BOOLEAN_PREFIX_PATTERN = /^(is|has|can|should)[A-Z0-9_]/;
const FEATURE_ROLE_SUFFIXES = new Set(["service", "types", "helpers", "errors", "repository", "controller", "handler", "mapper", "schema", "runtime"]);
const ROOT_SOURCE_EXEMPTIONS = new Set(["config.ts", "index.ts", "logger.ts", "main.ts"]);

function countReturnsInBody(body) {
  let returnCount = 0;

  visitNonNestedStatements(body, (node) => {
    if (ts.isReturnStatement(node)) {
      returnCount += 1;
    }
  });

  return returnCount;
}

function isBooleanLikeDeclaration(node) {
  if (node.type && node.type.kind === ts.SyntaxKind.BooleanKeyword) {
    return true;
  }

  return node.initializer ? node.initializer.kind === ts.SyntaxKind.TrueKeyword || node.initializer.kind === ts.SyntaxKind.FalseKeyword : false;
}

const SECTION_MARKER_PATTERN = /\/\*\*\s*\n\s*\* @section\s+([a-z:]+)\s*\n\s*\*\//g;

function collectSectionMarkers(raw) {
  return [...raw.matchAll(SECTION_MARKER_PATTERN)].map((match) => ({
    name: match[1],
    startIndex: match.index,
    endIndex: (match.index ?? 0) + match[0].length,
  }));
}

function stripCommentsAndWhitespace(raw) {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .trim();
}

function findEmptySectionMarkers(raw, markers) {
  const failures = [];

  for (const [index, marker] of markers.entries()) {
    const nextMarker = markers[index + 1];
    const sectionBody = raw.slice(marker.endIndex, nextMarker?.startIndex ?? raw.length);

    if (stripCommentsAndWhitespace(sectionBody).length === 0) {
      failures.push(
        createVerificationIssue({
          ruleId: "class-section-order",
          category: "source-rule",
          relativePath: "",
          message: `empty @section block must be omitted: ${marker.name}`,
        }),
      );
    }
  }

  return failures;
}

function verifyClassSectionPlacement(relativePath, raw, markers, exportedClass) {
  const classMarker = markers.find((marker) => marker.name === "class");

  if (!classMarker) {
    return [
      createVerificationIssue({
        ruleId: "class-section-order",
        category: "source-rule",
        relativePath,
        message: "public class files must declare @section class immediately before the exported class",
      }),
    ];
  }

  const classStartIndex = exportedClass.getStart(exportedClass.getSourceFile());

  if (classMarker.startIndex > classStartIndex) {
    return [
      createVerificationIssue({
        ruleId: "class-section-order",
        category: "source-rule",
        relativePath,
        message: "@section class must appear before the exported class declaration",
      }),
    ];
  }

  const between = raw.slice(classMarker.endIndex, classStartIndex);

  return between.trim().length === 0
    ? []
    : [
        createVerificationIssue({
          ruleId: "class-section-order",
          category: "source-rule",
          relativePath,
          message: "@section class must appear immediately before the exported class declaration",
        }),
      ];
}

function verifySectionOrder(relativePath, raw, sectionOrder, exportedClass) {
  const markers = collectSectionMarkers(raw);

  if (markers.length === 0) {
    return [
      createVerificationIssue({
        ruleId: "class-section-order",
        category: "source-rule",
        relativePath,
        message: "public class files must include ordered @section markers",
      }),
    ];
  }

  const failures = [];
  let lastIndex = -1;

  for (const marker of markers) {
    const markerIndex = sectionOrder.indexOf(marker.name);

    if (markerIndex < 0) {
      failures.push(
        createVerificationIssue({
          ruleId: "class-section-order",
          category: "source-rule",
          relativePath,
          message: `unknown @section marker: ${marker.name}`,
        }),
      );
      continue;
    }

    if (markerIndex < lastIndex) {
      failures.push(
        createVerificationIssue({
          ruleId: "class-section-order",
          category: "source-rule",
          relativePath,
          message: `out-of-order @section marker: ${marker.name}`,
        }),
      );
    }

    lastIndex = markerIndex;
  }

  for (const issue of findEmptySectionMarkers(raw, markers)) {
    failures.push({ ...issue, relativePath });
  }

  failures.push(...verifyClassSectionPlacement(relativePath, raw, markers, exportedClass));

  return failures;
}

function verifyFeatureFilename(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");

  if (!normalizedPath.startsWith("src/")) {
    return [];
  }

  const segments = normalizedPath.split("/");
  const fileName = segments.at(-1);

  if (segments.length <= 2 || ROOT_SOURCE_EXEMPTIONS.has(fileName)) {
    return [];
  }

  const roleMatch = fileName.match(/\.([a-z]+)\.ts$/);
  if (!roleMatch || !FEATURE_ROLE_SUFFIXES.has(roleMatch[1])) {
    return [
      createVerificationIssue({
        ruleId: "feature-filename-role",
        category: "source-rule",
        relativePath,
        message: "feature files must include an explicit role suffix such as .service.ts, .types.ts, or .helpers.ts",
      }),
    ];
  }

  return [];
}

function verifyFeatureClassOnly(relativePath, ast) {
  const normalizedPath = relativePath.split(path.sep).join("/");

  if (!normalizedPath.startsWith("src/")) {
    return [];
  }

  const segments = normalizedPath.split("/");
  const fileName = segments.at(-1);

  if (segments.length <= 2 || ROOT_SOURCE_EXEMPTIONS.has(fileName) || fileName.endsWith(".types.ts")) {
    return [];
  }

  const exportedClasses = ast.statements.filter((statement) => isExportedClass(statement));

  if (exportedClasses.length !== 1) {
    return [
      createVerificationIssue({
        ruleId: "feature-class-only",
        category: "source-rule",
        relativePath,
        message: "feature files must expose exactly one public class; only .types.ts files may expose non-class exports",
      }),
    ];
  }

  return [];
}

function verifyNoModuleFunctionsInClassFiles(relativePath, ast) {
  const exportedClasses = ast.statements.filter((statement) => isExportedClass(statement));

  if (exportedClasses.length === 0) {
    return [];
  }

  const issues = [];

  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      issues.push(
        createVerificationIssue({
          ruleId: "no-module-functions-in-class-files",
          category: "source-rule",
          relativePath,
          message: `class files must not define module-scope helper functions: ${statement.name.text}`,
        }),
      );
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
        issues.push(
          createVerificationIssue({
            ruleId: "no-module-functions-in-class-files",
            category: "source-rule",
            relativePath,
            message: `class files must not define module-scope helper functions: ${declaration.name.text}`,
          }),
        );
      }
    }
  }

  return issues;
}

function verifyConfigImport(relativePath, node) {
  const specifier = node.moduleSpecifier.text;

  if (!specifier.startsWith(".") || !/(^|\/)config(?:\.ts)?$/.test(specifier)) {
    return [];
  }

  const failures = [];
  const importClause = node.importClause;

  if (!specifier.endsWith("config.ts")) {
    failures.push(
      createVerificationIssue({
        ruleId: "canonical-config-import",
        category: "source-rule",
        relativePath,
        message: "config imports must include the .ts extension",
      }),
    );
  }

  if (!importClause || !importClause.name || importClause.name.text !== "config" || importClause.namedBindings) {
    failures.push(
      createVerificationIssue({
        ruleId: "canonical-config-import",
        category: "source-rule",
        relativePath,
        message: 'config imports must use `import config from ".../config.ts"`',
      }),
    );
  }

  return failures;
}

function verifyIdentifier(ruleId, relativePath, name) {
  if (!name) {
    return [];
  }

  return FORBIDDEN_IDENTIFIER_NAMES.has(name)
    ? [
        createVerificationIssue({
          ruleId,
          category: "source-rule",
          relativePath,
          message: `forbidden generic identifier: ${name}`,
        }),
      ]
    : [];
}

function verifyBooleanName(relativePath, name) {
  if (!name || BOOLEAN_PREFIX_PATTERN.test(name)) {
    return [];
  }

  return [
    createVerificationIssue({
      ruleId: "boolean-prefix",
      category: "source-rule",
      relativePath,
      message: `boolean identifier must start with is/has/can/should: ${name}`,
    }),
  ];
}

export async function verifySourceRules(targetPath, contract, options = {}) {
  const activeRuleIds = getActiveVerifyRuleIds(contract);
  const sectionOrder = Array.isArray(contract.profile.comment_section_blocks) ? contract.profile.comment_section_blocks : [];
  const files = options.analysisContext?.sourceFiles ?? (await loadProjectSourceFiles(targetPath, options));
  const errors = [];

  for (const file of files) {
    const { relativePath, ast, raw } = file;
    const isSourceFile = relativePath.startsWith("src/");
    const isTransportSourceFile = relativePath.startsWith("src/http/");
    const exportedClasses = ast.statements.filter((statement) => isExportedClass(statement));

    if (
      isSourceFile &&
      activeRuleIds.has("one-public-class-per-file") &&
      shouldRunRule(options.onlyRuleIds, "one-public-class-per-file") &&
      exportedClasses.length > 1
    ) {
      errors.push(
        createVerificationIssue({
          ruleId: "one-public-class-per-file",
          category: "source-rule",
          relativePath,
          message: "source files may expose at most one public class",
        }),
      );
    }

    if (isSourceFile && activeRuleIds.has("class-section-order") && shouldRunRule(options.onlyRuleIds, "class-section-order") && exportedClasses.length > 0) {
      errors.push(...verifySectionOrder(relativePath, raw, sectionOrder, exportedClasses[0]));
    }

    if (isSourceFile && activeRuleIds.has("feature-filename-role") && shouldRunRule(options.onlyRuleIds, "feature-filename-role")) {
      errors.push(...verifyFeatureFilename(relativePath));
    }

    if (isSourceFile && activeRuleIds.has("feature-class-only") && shouldRunRule(options.onlyRuleIds, "feature-class-only")) {
      errors.push(...verifyFeatureClassOnly(relativePath, ast));
    }

    if (isSourceFile && activeRuleIds.has("no-module-functions-in-class-files") && shouldRunRule(options.onlyRuleIds, "no-module-functions-in-class-files")) {
      errors.push(...verifyNoModuleFunctionsInClassFiles(relativePath, ast));
    }

    visitNodes(ast, (node) => {
      if (isSourceFile && !isTransportSourceFile && activeRuleIds.has("single-return") && shouldRunRule(options.onlyRuleIds, "single-return")) {
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isConstructorDeclaration(node)
        ) {
          if (node.body && countReturnsInBody(node.body) > 1) {
            errors.push(
              createVerificationIssue({
                ruleId: "single-return",
                category: "source-rule",
                relativePath,
                message: "functions and methods outside src/http/ must use a single return statement",
              }),
            );
          }
        }
      }

      if (
        isSourceFile &&
        activeRuleIds.has("async-await-only") &&
        shouldRunRule(options.onlyRuleIds, "async-await-only") &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const callName = node.expression.name.text;

        if (callName === "then" || callName === "catch") {
          errors.push(
            createVerificationIssue({
              ruleId: "async-await-only",
              category: "source-rule",
              relativePath,
              message: "promise chains are forbidden in src/; use async/await instead",
            }),
          );
        }
      }

      if (
        isSourceFile &&
        activeRuleIds.has("canonical-config-import") &&
        shouldRunRule(options.onlyRuleIds, "canonical-config-import") &&
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        errors.push(...verifyConfigImport(relativePath, node));
      }

      if (activeRuleIds.has("domain-specific-identifiers") && shouldRunRule(options.onlyRuleIds, "domain-specific-identifiers")) {
        if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyDeclaration(node) || ts.isBindingElement(node)) {
          errors.push(...verifyIdentifier("domain-specific-identifiers", relativePath, getIdentifierText(node.name)));
        }
      }

      if (activeRuleIds.has("boolean-prefix") && shouldRunRule(options.onlyRuleIds, "boolean-prefix")) {
        if ((ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyDeclaration(node)) && isBooleanLikeDeclaration(node)) {
          errors.push(...verifyBooleanName(relativePath, getIdentifierText(node.name)));
        }
      }
    });
  }

  return errors;
}
