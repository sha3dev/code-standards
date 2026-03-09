import ts from "typescript";

import { DEFAULT_PROFILE } from "../constants.mjs";
import { createVerificationIssue, shouldRunRule } from "./issue-helpers.mjs";
import { getIdentifierText, getLineAndColumn, getNodeTextSlice } from "./source-analysis.mjs";

const SIMPLE_CALLBACK_METHODS = new Set(["map", "filter", "reduce", "some", "every", "find", "forEach"]);
const MODULE_CONSTANT_PATTERN = /^[A-Z0-9_]+$/;
const CAMEL_CASE_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
const COMPACT_NODE_KINDS = new Set([
  ts.SyntaxKind.ImportDeclaration,
  ts.SyntaxKind.ArrayLiteralExpression,
  ts.SyntaxKind.ObjectLiteralExpression,
  ts.SyntaxKind.VariableStatement,
]);

function getActiveRuleIds(contract) {
  return new Set(contract.rules.filter((rule) => rule.blocking).map((rule) => rule.id));
}

function createIssue(ruleId, relativePath, node, message, options = {}) {
  const location = node && "getStart" in node && "getSourceFile" in node ? getLineAndColumn(node.getSourceFile(), node.getStart(node.getSourceFile())) : {};
  return createVerificationIssue({
    ruleId,
    category: "typescript-style",
    relativePath,
    line: location.line,
    column: location.column,
    message,
    verificationMode: options.verificationMode,
    confidence: options.confidence,
    evidence: options.evidence,
    suggestion: options.suggestion,
  });
}

function isExported(node) {
  return Array.isArray(node.modifiers) && node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function isTypePosition(node) {
  let current = node;

  while (current.parent) {
    if (ts.isTypeNode(current.parent) || ts.isExpressionWithTypeArguments(current.parent) || ts.isHeritageClause(current.parent)) {
      return true;
    }

    if (
      ts.isImportClause(current.parent) ||
      ts.isImportSpecifier(current.parent) ||
      ts.isImportEqualsDeclaration(current.parent) ||
      ts.isExportSpecifier(current.parent)
    ) {
      return false;
    }

    current = current.parent;
  }

  return false;
}

function collectPublicApiExports(indexFile) {
  const exportNames = new Set();

  if (!indexFile) {
    return exportNames;
  }

  ts.forEachChild(indexFile.ast, (node) => {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        exportNames.add(element.name.text);
      }
    }

    if (
      (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      isExported(node) &&
      node.name
    ) {
      exportNames.add(node.name.text);
    }
  });

  return exportNames;
}

function collectImportUsages(ast) {
  const usages = new Map();

  function visit(node) {
    if (ts.isIdentifier(node)) {
      const references = usages.get(node.text) ?? [];
      references.push(node);
      usages.set(node.text, references);
    }

    ts.forEachChild(node, visit);
  }

  visit(ast);
  return usages;
}

function compactTextForNode(sourceFile, node) {
  return getNodeTextSlice(sourceFile, node).replace(/\s+/g, " ").trim();
}

function bodyLineCount(node) {
  const sourceFile = node.getSourceFile();
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
  return end - start + 1;
}

export async function verifyTypeScriptStyle(targetPath, contract, analysisContext, options = {}) {
  const activeRuleIds = getActiveRuleIds(contract);
  const issues = [];
  const publicApiExports = collectPublicApiExports(analysisContext.sourceFilesByRelativePath.get("src/index.ts"));
  const sectionOrder = Array.isArray(contract.profile.comment_section_blocks)
    ? contract.profile.comment_section_blocks
    : DEFAULT_PROFILE.comment_section_blocks;

  for (const file of analysisContext.sourceFiles) {
    const importUsages = collectImportUsages(file.ast);

    ts.forEachChild(file.ast, function visit(node) {
      if (activeRuleIds.has("no-any") && shouldRunRule(options.onlyRuleIds, "no-any") && node.kind === ts.SyntaxKind.AnyKeyword) {
        issues.push(createIssue("no-any", file.relativePath, node, "explicit any is forbidden"));
      }

      if (
        activeRuleIds.has("module-constant-case") &&
        shouldRunRule(options.onlyRuleIds, "module-constant-case") &&
        ts.isVariableStatement(node) &&
        isTopLevelConst(node)
      ) {
        for (const declaration of node.declarationList.declarations) {
          const name = getIdentifierText(declaration.name);
          if (name && name !== "config" && !MODULE_CONSTANT_PATTERN.test(name)) {
            issues.push(
              createIssue("module-constant-case", file.relativePath, declaration.name, `module-level constants must use SCREAMING_SNAKE_CASE: ${name}`),
            );
          }
        }
      }

      if (
        activeRuleIds.has("config-default-export-name") &&
        shouldRunRule(options.onlyRuleIds, "config-default-export-name") &&
        file.relativePath === "src/config.ts"
      ) {
        issues.push(...verifyConfigDefaultExport(file));
      }

      if (
        activeRuleIds.has("explicit-export-return-types") &&
        shouldRunRule(options.onlyRuleIds, "explicit-export-return-types") &&
        ((ts.isFunctionDeclaration(node) && isExported(node)) ||
          (ts.isMethodDeclaration(node) && ts.isClassDeclaration(node.parent) && isExported(node.parent)))
      ) {
        const isPublicMethod =
          !ts.isMethodDeclaration(node) || !Array.isArray(node.modifiers) || node.modifiers.every((modifier) => modifier.kind !== ts.SyntaxKind.PrivateKeyword);
        if (isPublicMethod && !node.type) {
          issues.push(
            createIssue(
              "explicit-export-return-types",
              file.relativePath,
              node.name ?? node,
              "exported functions and public methods must declare an explicit return type",
            ),
          );
        }
      }

      if (
        activeRuleIds.has("prefer-types-over-interfaces") &&
        shouldRunRule(options.onlyRuleIds, "prefer-types-over-interfaces") &&
        ts.isInterfaceDeclaration(node)
      ) {
        const isPublicContract = isExported(node) && node.name && publicApiExports.has(node.name.text);
        if (!isPublicContract) {
          issues.push(createIssue("prefer-types-over-interfaces", file.relativePath, node.name, "prefer type aliases over interfaces for local modeling"));
        }
      }

      if (activeRuleIds.has("control-flow-braces") && shouldRunRule(options.onlyRuleIds, "control-flow-braces")) {
        issues.push(...verifyControlFlowBraces(file.relativePath, node));
      }

      if (
        activeRuleIds.has("concise-simple-callbacks") &&
        shouldRunRule(options.onlyRuleIds, "concise-simple-callbacks") &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        SIMPLE_CALLBACK_METHODS.has(node.expression.name.text)
      ) {
        for (const argument of node.arguments) {
          if (
            ts.isArrowFunction(argument) &&
            ts.isBlock(argument.body) &&
            argument.body.statements.length === 1 &&
            ts.isReturnStatement(argument.body.statements[0]) &&
            argument.body.statements[0].expression
          ) {
            issues.push(createIssue("concise-simple-callbacks", file.relativePath, argument, "simple callbacks must use concise expression arrows"));
          }
        }
      }

      if (
        activeRuleIds.has("compact-single-line-constructs") &&
        shouldRunRule(options.onlyRuleIds, "compact-single-line-constructs") &&
        COMPACT_NODE_KINDS.has(node.kind)
      ) {
        const nodeText = getNodeTextSlice(file.ast, node);
        const compactText = compactTextForNode(file.ast, node);
        if (nodeText.includes("\n") && compactText.length <= 160) {
          issues.push(
            createIssue("compact-single-line-constructs", file.relativePath, node, "construct fits on one line and should stay compact", {
              verificationMode: "heuristic",
              confidence: "high",
              evidence: compactText,
            }),
          );
        }
      }

      if (
        activeRuleIds.has("single-responsibility-heuristic") &&
        shouldRunRule(options.onlyRuleIds, "single-responsibility-heuristic") &&
        (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
        node.body &&
        bodyLineCount(node.body) > 30
      ) {
        issues.push(
          createIssue(
            "single-responsibility-heuristic",
            file.relativePath,
            node.name ?? node,
            "long functions should be split when they start mixing responsibilities",
            {
              verificationMode: "heuristic",
              confidence: "medium",
              evidence: `${bodyLineCount(node.body)} body lines`,
            },
          ),
        );
      }

      ts.forEachChild(node, visit);
    });

    if (activeRuleIds.has("local-constant-case") && shouldRunRule(options.onlyRuleIds, "local-constant-case")) {
      issues.push(...verifyLocalConstants(file));
    }

    if (activeRuleIds.has("type-only-imports") && shouldRunRule(options.onlyRuleIds, "type-only-imports")) {
      issues.push(...verifyTypeOnlyImports(file, importUsages));
    }

    if (activeRuleIds.has("comments-policy-audit") && shouldRunRule(options.onlyRuleIds, "comments-policy-audit") && file.relativePath.startsWith("src/")) {
      issues.push(...verifyCommentsAudit(file, sectionOrder));
    }
  }

  return issues;
}

function isTopLevelConst(node) {
  return ts.isSourceFile(node.parent) && node.declarationList.flags & ts.NodeFlags.Const;
}

function verifyLocalConstants(file) {
  const issues = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.parent && ts.isVariableDeclarationList(node.parent) && node.parent.flags & ts.NodeFlags.Const) {
      const isTopLevel = ts.isVariableStatement(node.parent.parent) && ts.isSourceFile(node.parent.parent.parent);
      const name = getIdentifierText(node.name);
      if (!isTopLevel && name && !CAMEL_CASE_PATTERN.test(name)) {
        issues.push(createIssue("local-constant-case", file.relativePath, node.name, `local constants must use camelCase: ${name}`));
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(file.ast);
  return issues;
}

function verifyConfigDefaultExport(file) {
  const issues = [];
  let hasNamedConfigDeclaration = false;
  let hasDefaultExportConfig = false;

  for (const statement of file.ast.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (getIdentifierText(declaration.name) === "config") {
          hasNamedConfigDeclaration = true;
        }
      }
    }

    if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression) && statement.expression.text === "config") {
      hasDefaultExportConfig = true;
    }
  }

  if (!hasNamedConfigDeclaration || !hasDefaultExportConfig) {
    issues.push(
      createIssue("config-default-export-name", file.relativePath, file.ast, "src/config.ts must declare `config` and export it as `export default config`"),
    );
  }

  return issues;
}

function verifyControlFlowBraces(relativePath, node) {
  const issues = [];

  if (ts.isIfStatement(node)) {
    if (!ts.isBlock(node.thenStatement)) {
      issues.push(createIssue("control-flow-braces", relativePath, node.thenStatement, "if branches must use braces"));
    }

    if (node.elseStatement && !ts.isBlock(node.elseStatement)) {
      issues.push(createIssue("control-flow-braces", relativePath, node.elseStatement, "else branches must use braces"));
    }
  }

  if (
    (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) &&
    !ts.isBlock(node.statement)
  ) {
    issues.push(createIssue("control-flow-braces", relativePath, node.statement, "loop bodies must use braces"));
  }

  return issues;
}

function verifyTypeOnlyImports(file, importUsages) {
  const issues = [];

  for (const statement of file.ast.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause || statement.importClause.isTypeOnly) {
      continue;
    }

    const importedIdentifiers = [];

    if (statement.importClause.name) {
      importedIdentifiers.push(statement.importClause.name.text);
    }

    if (statement.importClause.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
      for (const element of statement.importClause.namedBindings.elements) {
        importedIdentifiers.push(element.name.text);
      }
    }

    for (const importedIdentifier of importedIdentifiers) {
      const identifierUsages = (importUsages.get(importedIdentifier) ?? []).filter(
        (node) => !ts.isImportClause(node.parent) && !ts.isImportSpecifier(node.parent) && !ts.isNamespaceImport(node.parent),
      );
      if (identifierUsages.length > 0 && identifierUsages.every((node) => isTypePosition(node))) {
        issues.push(
          createIssue("type-only-imports", file.relativePath, statement, `import used only in type positions must use import type: ${importedIdentifier}`),
        );
      }
    }
  }

  return issues;
}

function verifyCommentsAudit(file, sectionOrder) {
  const issues = [];
  const hasSections = sectionOrder.some((section) => file.raw.includes(`@section ${section}`));
  const complexSignals = ["if (", "switch (", "try {", ".map(", ".reduce(", ".filter("].filter((token) => file.raw.includes(token)).length;
  const commentSignal = /\/\//.test(file.raw) || /\/\*/.test(file.raw);

  if (complexSignals >= 3 && !commentSignal && !hasSections) {
    issues.push(
      createIssue("comments-policy-audit", file.relativePath, file.ast, "non-trivial logic should include explicit comments under the active comments policy", {
        verificationMode: "audit",
        confidence: "medium",
      }),
    );
  }

  return issues;
}
