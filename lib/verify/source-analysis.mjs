import { readFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

import { listRelativeFiles } from "../project/template-resolution.mjs";
import { isFileSelected } from "./issue-helpers.mjs";

export async function loadProjectSourceFiles(targetPath, options = {}) {
  const files = await listRelativeFiles(targetPath);
  const sourceFiles = [];

  for (const relativePath of files) {
    if ((!relativePath.startsWith("src/") && !relativePath.startsWith("test/")) || !relativePath.endsWith(".ts") || relativePath.endsWith(".d.ts")) {
      continue;
    }

    if (!isFileSelected(options.files, relativePath)) {
      continue;
    }

    const absolutePath = path.join(targetPath, relativePath);
    const raw = await readFile(absolutePath, "utf8");
    const ast = ts.createSourceFile(absolutePath, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    sourceFiles.push({ relativePath, absolutePath, raw, ast });
  }

  return sourceFiles;
}

export function isExportedClass(node) {
  return ts.isClassDeclaration(node) && Array.isArray(node.modifiers) && node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

export function visitNodes(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => visitNodes(child, visitor));
}

export function visitNonNestedStatements(node, visitor) {
  ts.forEachChild(node, (child) => {
    if (
      ts.isFunctionDeclaration(child) ||
      ts.isFunctionExpression(child) ||
      ts.isArrowFunction(child) ||
      ts.isMethodDeclaration(child) ||
      ts.isConstructorDeclaration(child)
    ) {
      return;
    }

    visitor(child);
    visitNonNestedStatements(child, visitor);
  });
}

export function getIdentifierText(name) {
  return ts.isIdentifier(name) ? name.text : null;
}
