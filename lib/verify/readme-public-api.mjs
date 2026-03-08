import { readFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

import { pathExists } from "../utils/fs.mjs";

function hasExportModifier(node) {
  return Array.isArray(node.modifiers) && node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function getDeclarationName(node) {
  return node.name && ts.isIdentifier(node.name) ? node.name.text : null;
}

function getPublicMethods(node) {
  const methods = [];

  for (const member of node.members) {
    if (!ts.isMethodDeclaration(member)) {
      continue;
    }

    const methodName = member.name && ts.isIdentifier(member.name) ? member.name.text : null;

    if (!methodName) {
      continue;
    }

    methods.push(methodName);
  }

  return methods.sort((left, right) => left.localeCompare(right));
}

function createDescriptor(kind, publicMethods = []) {
  return { kind, publicMethods };
}

function collectLocalDeclarations(sourceFile) {
  const declarations = new Map();

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const className = getDeclarationName(statement);
      if (className) {
        declarations.set(className, createDescriptor("class", getPublicMethods(statement)));
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement)) {
      const functionName = getDeclarationName(statement);
      if (functionName) {
        declarations.set(functionName, createDescriptor("function"));
      }
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      const typeName = getDeclarationName(statement);
      if (typeName) {
        declarations.set(typeName, createDescriptor("type"));
      }
      continue;
    }

    if (ts.isEnumDeclaration(statement)) {
      const enumName = getDeclarationName(statement);
      if (enumName) {
        declarations.set(enumName, createDescriptor("value"));
      }
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          declarations.set(declaration.name.text, createDescriptor("value"));
        }
      }
    }
  }

  return declarations;
}

function resolveModuleSpecifier(fromFilePath, specifier) {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const basePath = path.resolve(path.dirname(fromFilePath), specifier);
  const candidates = [basePath, `${basePath}.ts`, path.join(basePath, "index.ts")];

  return candidates;
}

async function readSourceFile(filePath) {
  if (!(await pathExists(filePath))) {
    return null;
  }

  const raw = await readFile(filePath, "utf8");
  return ts.createSourceFile(filePath, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

async function extractModuleExports(filePath, cache) {
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }

  const sourceFile = await readSourceFile(filePath);

  if (!sourceFile) {
    const empty = new Map();
    cache.set(filePath, empty);
    return empty;
  }

  const declarations = collectLocalDeclarations(sourceFile);
  const exportedDeclarations = new Map();
  cache.set(filePath, exportedDeclarations);

  for (const statement of sourceFile.statements) {
    if (
      hasExportModifier(statement) &&
      (ts.isClassDeclaration(statement) ||
        ts.isFunctionDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isEnumDeclaration(statement))
    ) {
      const name = getDeclarationName(statement);

      if (name && declarations.has(name)) {
        exportedDeclarations.set(name, declarations.get(name));
      }

      continue;
    }

    if (hasExportModifier(statement) && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declarations.has(declaration.name.text)) {
          exportedDeclarations.set(declaration.name.text, declarations.get(declaration.name.text));
        }
      }

      continue;
    }

    if (!ts.isExportDeclaration(statement)) {
      continue;
    }

    const moduleSpecifier = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : null;

    if (!moduleSpecifier) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const exportElement of statement.exportClause.elements) {
          const sourceName = exportElement.propertyName?.text ?? exportElement.name.text;
          const exportName = exportElement.name.text;
          const descriptor = declarations.get(sourceName);

          if (descriptor) {
            exportedDeclarations.set(exportName, descriptor);
          }
        }
      }

      continue;
    }

    const candidates = resolveModuleSpecifier(filePath, moduleSpecifier);

    if (!candidates) {
      continue;
    }

    let targetExports = null;

    for (const candidatePath of candidates) {
      if (await pathExists(candidatePath)) {
        targetExports = await extractModuleExports(candidatePath, cache);
        break;
      }
    }

    if (!targetExports) {
      continue;
    }

    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const exportElement of statement.exportClause.elements) {
        const sourceName = exportElement.propertyName?.text ?? exportElement.name.text;
        const exportName = exportElement.name.text;
        const descriptor = targetExports.get(sourceName);

        if (descriptor) {
          exportedDeclarations.set(exportName, descriptor);
        }
      }

      continue;
    }

    for (const [exportName, descriptor] of targetExports.entries()) {
      exportedDeclarations.set(exportName, descriptor);
    }
  }

  return exportedDeclarations;
}

export async function extractPublicReadmeApi(targetPath) {
  const indexPath = path.join(targetPath, "src", "index.ts");
  const exportedDeclarations = await extractModuleExports(indexPath, new Map());

  return {
    exports: [...exportedDeclarations.entries()]
      .map(([exportName, descriptor]) => ({
        exportName,
        kind: descriptor.kind,
        publicMethods: descriptor.publicMethods,
      }))
      .sort((left, right) => left.exportName.localeCompare(right.exportName)),
  };
}
