import path from "node:path";

import ts from "typescript";

import { getIdentifierText, isExportedClass, loadProjectSourceFiles, visitNodes, visitNonNestedStatements } from "./source-analysis.mjs";

const FORBIDDEN_IDENTIFIER_NAMES = new Set(["data", "obj", "tmp", "val", "thing", "helper", "utils", "common"]);
const BOOLEAN_PREFIX_PATTERN = /^(is|has|can|should)[A-Z0-9_]/;
const FEATURE_ROLE_SUFFIXES = new Set(["service", "types", "errors", "repository", "controller", "handler", "mapper", "schema", "runtime"]);
const ROOT_SOURCE_EXEMPTIONS = new Set(["config.ts", "index.ts", "logger.ts", "main.ts"]);

function ruleEnabled(activeRuleIds, ruleId) {
  return activeRuleIds.has(ruleId);
}

function createError(ruleId, relativePath, message) {
  return `[${ruleId}] ${relativePath}: ${message}`;
}

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

function collectSectionMarkers(raw) {
  return [...raw.matchAll(/@section\s+([a-z:]+)/g)].map((match) => match[1]);
}

function verifySectionOrder(relativePath, raw, sectionOrder) {
  const markers = collectSectionMarkers(raw);

  if (markers.length === 0) {
    return [createError("class-section-order", relativePath, "public class files must include ordered @section markers")];
  }

  const failures = [];
  let lastIndex = -1;

  for (const marker of markers) {
    const markerIndex = sectionOrder.indexOf(marker);

    if (markerIndex < 0) {
      failures.push(createError("class-section-order", relativePath, `unknown @section marker: ${marker}`));
      continue;
    }

    if (markerIndex < lastIndex) {
      failures.push(createError("class-section-order", relativePath, `out-of-order @section marker: ${marker}`));
    }

    lastIndex = markerIndex;
  }

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
    return [createError("feature-filename-role", relativePath, "feature files must include an explicit role suffix such as .service.ts or .types.ts")];
  }

  return [];
}

function verifyConfigImport(relativePath, node) {
  const specifier = node.moduleSpecifier.text;

  if (!specifier.startsWith(".") || !/(^|\/)config(?:\.ts)?$/.test(specifier)) {
    return [];
  }

  const failures = [];
  const importClause = node.importClause;

  if (!specifier.endsWith("config.ts")) {
    failures.push(createError("canonical-config-import", relativePath, "config imports must include the .ts extension"));
  }

  if (!importClause || !importClause.name || importClause.name.text !== "config" || importClause.namedBindings) {
    failures.push(createError("canonical-config-import", relativePath, 'config imports must use `import config from ".../config.ts"`'));
  }

  return failures;
}

function verifyIdentifier(ruleId, relativePath, name) {
  if (!name) {
    return [];
  }

  return FORBIDDEN_IDENTIFIER_NAMES.has(name) ? [createError(ruleId, relativePath, `forbidden generic identifier: ${name}`)] : [];
}

function verifyBooleanName(relativePath, name) {
  if (!name || BOOLEAN_PREFIX_PATTERN.test(name)) {
    return [];
  }

  return [createError("boolean-prefix", relativePath, `boolean identifier must start with is/has/can/should: ${name}`)];
}

export async function verifySourceRules(targetPath, contract) {
  const activeRuleIds = new Set(contract.rules.filter((rule) => rule.deterministic).map((rule) => rule.id));
  const sectionOrder = Array.isArray(contract.profile.comment_section_blocks) ? contract.profile.comment_section_blocks : [];
  const files = await loadProjectSourceFiles(targetPath);
  const errors = [];

  for (const file of files) {
    const { relativePath, ast, raw } = file;
    const isSourceFile = relativePath.startsWith("src/");
    const exportedClasses = ast.statements.filter((statement) => isExportedClass(statement));

    if (isSourceFile && ruleEnabled(activeRuleIds, "one-public-class-per-file") && exportedClasses.length > 1) {
      errors.push(createError("one-public-class-per-file", relativePath, "source files may expose at most one public class"));
    }

    if (isSourceFile && ruleEnabled(activeRuleIds, "class-section-order") && exportedClasses.length > 0) {
      errors.push(...verifySectionOrder(relativePath, raw, sectionOrder));
    }

    if (isSourceFile && ruleEnabled(activeRuleIds, "feature-filename-role")) {
      errors.push(...verifyFeatureFilename(relativePath));
    }

    visitNodes(ast, (node) => {
      if (isSourceFile && ruleEnabled(activeRuleIds, "single-return")) {
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isConstructorDeclaration(node)
        ) {
          if (node.body && countReturnsInBody(node.body) > 1) {
            errors.push(createError("single-return", relativePath, "functions and methods in src/ must use a single return statement"));
          }
        }
      }

      if (isSourceFile && ruleEnabled(activeRuleIds, "async-await-only") && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const callName = node.expression.name.text;

        if (callName === "then" || callName === "catch") {
          errors.push(createError("async-await-only", relativePath, "promise chains are forbidden in src/; use async/await instead"));
        }
      }

      if (isSourceFile && ruleEnabled(activeRuleIds, "canonical-config-import") && ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        errors.push(...verifyConfigImport(relativePath, node));
      }

      if (ruleEnabled(activeRuleIds, "domain-specific-identifiers")) {
        if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyDeclaration(node) || ts.isBindingElement(node)) {
          errors.push(...verifyIdentifier("domain-specific-identifiers", relativePath, getIdentifierText(node.name)));
        }
      }

      if (ruleEnabled(activeRuleIds, "boolean-prefix")) {
        if ((ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyDeclaration(node)) && isBooleanLikeDeclaration(node)) {
          errors.push(...verifyBooleanName(relativePath, getIdentifierText(node.name)));
        }
      }
    });
  }

  return errors;
}
