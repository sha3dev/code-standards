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

export async function loadProjectAnalysisContext(targetPath, options = {}) {
  const sourceFiles = await loadProjectSourceFiles(targetPath, options);
  const absolutePaths = sourceFiles.map((file) => file.absolutePath);
  const compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: false,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
  const program = ts.createProgram(absolutePaths, compilerOptions);
  const checker = program.getTypeChecker();
  const sourceFilesByPath = new Map();
  const sourceFilesByRelativePath = new Map();

  for (const file of sourceFiles) {
    const programSourceFile = program.getSourceFile(file.absolutePath);
    const enriched = {
      ...file,
      ast: programSourceFile ?? file.ast,
      featureName: getFeatureName(file.relativePath),
      isRootSourceFile: isRootSourceFile(file.relativePath),
    };
    sourceFilesByPath.set(file.absolutePath, enriched);
    sourceFilesByRelativePath.set(file.relativePath, enriched);
  }

  return { targetPath, compilerOptions, sourceFiles: [...sourceFilesByRelativePath.values()], sourceFilesByPath, sourceFilesByRelativePath, program, checker };
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

export function getFeatureName(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");

  if (!normalizedPath.startsWith("src/")) {
    return null;
  }

  const segments = normalizedPath.split("/");
  return segments.length >= 3 ? segments[1] : null;
}

export function isRootSourceFile(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  return normalizedPath.startsWith("src/") && normalizedPath.split("/").length === 2;
}

export function resolveImportRelativePath(relativePath, specifier) {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const normalizedSourceDir = path.posix.dirname(relativePath.split(path.sep).join("/"));
  const resolved = path.posix.normalize(path.posix.join(normalizedSourceDir, specifier));
  return resolved.endsWith(".ts") ? resolved : `${resolved}.ts`;
}

export function getLineAndColumn(sourceFile, position) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(position);
  return { line: line + 1, column: character + 1 };
}

export function getNodeTextSlice(sourceFile, node) {
  return sourceFile.text.slice(node.getStart(sourceFile), node.getEnd());
}
