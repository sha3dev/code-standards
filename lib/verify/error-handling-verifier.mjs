import ts from "typescript";

import { createVerificationIssue, shouldRunRule } from "./issue-helpers.mjs";
import { getLineAndColumn } from "./source-analysis.mjs";

const GENERIC_ERROR_MESSAGE_PATTERN = /^(error|failed|invalid|unexpected|oops|bad request)$/i;

function getActiveRuleIds(contract) {
  return new Set(contract.rules.filter((rule) => rule.blocking).map((rule) => rule.id));
}

function createIssue(ruleId, relativePath, node, message, options = {}) {
  const location = node && "getStart" in node && "getSourceFile" in node ? getLineAndColumn(node.getSourceFile(), node.getStart(node.getSourceFile())) : {};
  return createVerificationIssue({
    ruleId,
    category: "error-handling",
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

function extendsError(node) {
  if (!node.heritageClauses) {
    return false;
  }

  return node.heritageClauses.some(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword && clause.types.some((typeNode) => typeNode.expression.getText() === "Error"),
  );
}

function collectTypedErrors(sourceFiles) {
  const typedErrors = new Map();

  for (const file of sourceFiles) {
    ts.forEachChild(file.ast, (node) => {
      if (ts.isClassDeclaration(node) && node.name && extendsError(node)) {
        typedErrors.set(node.name.text, { file, node });
      }
    });
  }

  return typedErrors;
}

function collectErrorConsumers(sourceFiles) {
  const consumers = new Set();

  for (const file of sourceFiles) {
    function visit(node) {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword && ts.isIdentifier(node.right)) {
        consumers.add(node.right.text);
      }

      ts.forEachChild(node, visit);
    }

    visit(file.ast);
  }

  return consumers;
}

function hasMeaningfulCatchHandling(catchClause) {
  if (!catchClause.block.statements.length) {
    return false;
  }

  return catchClause.block.statements.some((statement) => {
    if (ts.isThrowStatement(statement)) {
      return true;
    }

    if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && ts.isPropertyAccessExpression(statement.expression.expression)) {
      const propertyName = statement.expression.expression.name.text;
      return propertyName === "error" || propertyName === "warn" || propertyName === "catch";
    }

    return false;
  });
}

function readThrownErrorMessage(expression) {
  if (
    ts.isNewExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.arguments?.length === 1 &&
    ts.isStringLiteralLike(expression.arguments[0])
  ) {
    return expression.arguments[0].text;
  }

  return null;
}

export async function verifyErrorHandling(_targetPath, contract, analysisContext, options = {}) {
  const activeRuleIds = new Set(getActiveRuleIds(contract));
  const typedErrors = collectTypedErrors(analysisContext.sourceFiles);
  const errorConsumers = collectErrorConsumers(analysisContext.sourceFiles);
  const issues = [];

  for (const file of analysisContext.sourceFiles) {
    function visit(node) {
      if (
        activeRuleIds.has("no-silent-catch") &&
        shouldRunRule(options.onlyRuleIds, "no-silent-catch") &&
        ts.isCatchClause(node) &&
        !hasMeaningfulCatchHandling(node)
      ) {
        issues.push(createIssue("no-silent-catch", file.relativePath, node, "catch blocks must rethrow, transform, or report errors"));
      }

      if (
        activeRuleIds.has("actionable-error-messages") &&
        shouldRunRule(options.onlyRuleIds, "actionable-error-messages") &&
        ts.isThrowStatement(node) &&
        node.expression
      ) {
        const errorMessage = readThrownErrorMessage(node.expression);
        if (errorMessage !== null && (errorMessage.trim().length === 0 || GENERIC_ERROR_MESSAGE_PATTERN.test(errorMessage.trim()))) {
          issues.push(
            createIssue("actionable-error-messages", file.relativePath, node.expression, "error messages should include actionable context", {
              verificationMode: "heuristic",
              confidence: "medium",
              evidence: JSON.stringify(errorMessage),
            }),
          );
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(file.ast);
  }

  if (activeRuleIds.has("typed-error-must-be-used") && shouldRunRule(options.onlyRuleIds, "typed-error-must-be-used")) {
    for (const [errorName, descriptor] of typedErrors) {
      if (!errorConsumers.has(errorName)) {
        issues.push(
          createIssue(
            "typed-error-must-be-used",
            descriptor.file.relativePath,
            descriptor.node.name,
            `custom error ${errorName} must have a real discriminating consumer such as instanceof`,
          ),
        );
      }
    }
  }

  if (activeRuleIds.has("plain-error-default") && shouldRunRule(options.onlyRuleIds, "plain-error-default")) {
    for (const [errorName, descriptor] of typedErrors) {
      if (!errorConsumers.has(errorName)) {
        issues.push(
          createIssue(
            "plain-error-default",
            descriptor.file.relativePath,
            descriptor.node.name,
            `prefer plain Error over ${errorName} when no control-flow consumer exists`,
            {
              verificationMode: "heuristic",
              confidence: "medium",
            },
          ),
        );
      }
    }
  }

  return issues;
}
