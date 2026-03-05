import Logger from "@sha3/logger";

const packageName = "{{packageName}}";

function resolveLoggerName(packageName: string): string {
  if (!packageName.startsWith("@")) {
    return packageName;
  }

  const [, unscopedName] = packageName.split("/");
  return unscopedName || packageName;
}

const LOGGER = new Logger({ loggerName: resolveLoggerName(packageName) });

export default LOGGER;
