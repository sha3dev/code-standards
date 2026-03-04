import Logger from "@sha3/logger";

const PACKAGE_NAME = "{{packageName}}";

function resolveLoggerName(packageName: string): string {
  if (!packageName.startsWith("@")) {
    return packageName;
  }

  const [, unscopedName] = packageName.split("/");
  return unscopedName || packageName;
}

const LOGGER = new Logger({ loggerName: resolveLoggerName(PACKAGE_NAME) });

export default LOGGER;
