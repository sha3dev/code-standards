import path from "node:path";

import { SECTION_ORDER } from "./section-order.mjs";

const FORBIDDEN_GENERIC_IDENTIFIERS = new Set(["data", "obj", "tmp", "val", "thing", "helper", "utils", "common"]);
const BOOLEAN_PREFIX_PATTERN = /^(is|has|can|should)[A-Z_]/;
const FEATURE_ROLE_SUFFIXES = [".service.ts", ".types.ts", ".errors.ts", ".repository.ts", ".schema.ts", ".mapper.ts", ".controller.ts", ".constants.ts"];
const SPECIAL_FEATURE_DIRECTORIES = new Set(["app", "shared", "http", "public", "internal"]);

function countReturns(node) {
  let total = 0;
  const visited = new WeakSet();

  const visit = (currentNode) => {
    if (!currentNode || typeof currentNode.type !== "string") {
      return;
    }

    if (visited.has(currentNode)) {
      return;
    }

    visited.add(currentNode);

    if (
      currentNode !== node &&
      (currentNode.type === "FunctionDeclaration" ||
        currentNode.type === "FunctionExpression" ||
        currentNode.type === "ArrowFunctionExpression" ||
        currentNode.type === "MethodDefinition")
    ) {
      return;
    }

    if (currentNode.type === "ReturnStatement") {
      total += 1;
    }

    for (const value of Object.values(currentNode)) {
      if (value === currentNode.parent) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const nested of value) {
          visit(nested);
        }
        continue;
      }

      if (value && typeof value === "object") {
        visit(value);
      }
    }
  };

  visit(node.body);
  return total;
}

function getExportedClassCount(program) {
  return program.body.filter((node) => {
    return (
      (node.type === "ExportNamedDeclaration" && node.declaration?.type === "ClassDeclaration") ||
      (node.type === "ExportDefaultDeclaration" && node.declaration?.type === "ClassDeclaration")
    );
  }).length;
}

function hasExportedClass(program) {
  return getExportedClassCount(program) > 0;
}

function collectSections(sourceCode) {
  return sourceCode
    .getAllComments()
    .map((comment) => /@section\s+([a-z:]+)/.exec(comment.value))
    .filter(Boolean)
    .map((match) => match[1]);
}

function isBooleanTypeAnnotation(typeAnnotation) {
  return typeAnnotation?.typeAnnotation?.type === "TSBooleanKeyword";
}

function isBooleanLiteralInitializer(initializer) {
  return initializer?.type === "Literal" && typeof initializer.value === "boolean";
}

function reportInvalidBooleanName(context, identifier) {
  if (!identifier || identifier.type !== "Identifier") {
    return;
  }

  if (!BOOLEAN_PREFIX_PATTERN.test(identifier.name)) {
    context.report({ node: identifier, message: "Boolean identifiers must start with is, has, can, or should." });
  }
}

const singleReturnRule = {
  meta: { type: "problem", docs: { description: "Enforce a single return statement per function." } },
  create(context) {
    return {
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
        if (context.filename?.includes(`${path.sep}src${path.sep}`) && countReturns(node) > 1) {
          context.report({ node, message: "Functions in src/ must use a single return statement." });
        }
      }
    };
  }
};

const noPromiseChainsRule = {
  meta: { type: "problem", docs: { description: "Disallow then/catch chains in src." } },
  create(context) {
    return {
      CallExpression(node) {
        if (!context.filename?.includes(`${path.sep}src${path.sep}`)) {
          return;
        }

        if (node.callee.type === "MemberExpression" && !node.callee.computed && node.callee.property.type === "Identifier") {
          if (node.callee.property.name === "then" || node.callee.property.name === "catch") {
            context.report({ node, message: "Use async/await instead of promise chains in src/." });
          }
        }
      }
    };
  }
};

const onePublicClassPerFileRule = {
  meta: { type: "problem", docs: { description: "Allow only one exported class per file." } },
  create(context) {
    return {
      Program(node) {
        if (getExportedClassCount(node) > 1) {
          context.report({ node, message: "A source file may expose at most one public class." });
        }
      }
    };
  }
};

const classSectionOrderRule = {
  meta: { type: "problem", docs: { description: "Require valid ordered @section markers in public class files." } },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      Program(node) {
        if (!hasExportedClass(node)) {
          return;
        }

        const sections = collectSections(sourceCode);

        if (sections.length === 0) {
          context.report({ node, message: "Public class files must include ordered @section markers." });
          return;
        }

        let lastIndex = -1;

        for (const section of sections) {
          const index = SECTION_ORDER.indexOf(section);

          if (index < 0) {
            context.report({ node, message: `Unknown @section marker: ${section}` });
            return;
          }

          if (index < lastIndex) {
            context.report({ node, message: "@section markers must stay in the canonical order." });
            return;
          }

          lastIndex = index;
        }

        for (const requiredSection of ["imports:externals", "imports:internals", "consts", "types", "constructor", "public:methods"]) {
          if (!sections.includes(requiredSection)) {
            context.report({ node, message: `Public class files must include @section ${requiredSection}.` });
            return;
          }
        }
      }
    };
  }
};

const canonicalConfigImportRule = {
  meta: { type: "problem", docs: { description: "Require canonical config.ts imports." } },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") {
          return;
        }

        if (!node.source.value.endsWith("config.ts")) {
          return;
        }

        const defaultImport = node.specifiers.find((specifier) => specifier.type === "ImportDefaultSpecifier");

        if (!defaultImport || defaultImport.local.name !== "config") {
          context.report({ node, message: 'config.ts must be imported as the default identifier named "config".' });
        }
      }
    };
  }
};

const forbiddenGenericIdentifiersRule = {
  meta: { type: "problem", docs: { description: "Disallow generic placeholder identifiers." } },
  create(context) {
    return {
      Identifier(node) {
        if (FORBIDDEN_GENERIC_IDENTIFIERS.has(node.name)) {
          context.report({ node, message: `Identifier "${node.name}" is too generic for new code.` });
        }
      }
    };
  }
};

const booleanPrefixRule = {
  meta: { type: "problem", docs: { description: "Require boolean identifier prefixes." } },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (isBooleanTypeAnnotation(node.id.type === "Identifier" ? node.id.typeAnnotation : undefined) || isBooleanLiteralInitializer(node.init)) {
          reportInvalidBooleanName(context, node.id);
        }
      },
      PropertyDefinition(node) {
        if (isBooleanTypeAnnotation(node.typeAnnotation) || isBooleanLiteralInitializer(node.value)) {
          reportInvalidBooleanName(context, node.key);
        }
      },
      TSPropertySignature(node) {
        if (isBooleanTypeAnnotation(node.typeAnnotation)) {
          reportInvalidBooleanName(context, node.key);
        }
      }
    };
  }
};

const featureFilenameRoleRule = {
  meta: { type: "problem", docs: { description: "Require feature filenames to match feature folder + role suffix." } },
  create(context) {
    return {
      Program(node) {
        const relativePath = path.relative(process.cwd(), context.filename);
        const normalizedPath = relativePath.split(path.sep).join("/");
        const match = /^src\/([^/]+)\/([^/]+)$/.exec(normalizedPath);

        if (!match) {
          return;
        }

        const [, featureName, fileName] = match;

        if (SPECIAL_FEATURE_DIRECTORIES.has(featureName) || fileName === "index.ts") {
          return;
        }

        const hasValidSuffix = FEATURE_ROLE_SUFFIXES.some((suffix) => fileName === `${featureName}${suffix}`);

        if (!hasValidSuffix) {
          context.report({ node, message: `Feature files must use the feature folder name plus an explicit role suffix. Received ${fileName}.` });
        }
      }
    };
  }
};

const plugin = {
  rules: {
    "single-return": singleReturnRule,
    "no-promise-chains": noPromiseChainsRule,
    "one-public-class-per-file": onePublicClassPerFileRule,
    "class-section-order": classSectionOrderRule,
    "canonical-config-import": canonicalConfigImportRule,
    "forbidden-generic-identifiers": forbiddenGenericIdentifiersRule,
    "boolean-prefix": booleanPrefixRule,
    "feature-filename-role": featureFilenameRoleRule
  }
};

export default plugin;
