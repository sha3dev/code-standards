export function replaceTokens(template, tokens) {
  let rendered = template;

  for (const [key, value] of Object.entries(tokens)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }

  return rendered;
}

export function normalizePackageName(rawPackageName, projectName) {
  if (!rawPackageName || rawPackageName.trim().length === 0) {
    return `@sha3/${projectName}`;
  }

  return rawPackageName.trim();
}

export function defaultPackageNameForProject(projectName) {
  return `@sha3/${projectName}`;
}

export function defaultRepositoryUrlForPackage(packageName) {
  const repositoryName = packageName.replace(/^@/, "").replace("/", "/");
  const normalizedRepositoryName = repositoryName.includes("/") ? repositoryName.split("/")[1] : repositoryName;
  return `https://github.com/sha3dev/${normalizedRepositoryName}`;
}

export function normalizeRepositoryUrl(rawRepositoryUrl, packageName) {
  if (!rawRepositoryUrl || rawRepositoryUrl.trim().length === 0) {
    return defaultRepositoryUrlForPackage(packageName);
  }

  return rawRepositoryUrl.trim();
}

export function mapTemplateFileName(fileName) {
  if (fileName === "gitignore") {
    return ".gitignore";
  }

  return fileName;
}
