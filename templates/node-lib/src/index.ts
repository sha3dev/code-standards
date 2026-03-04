import CONFIG from "./config.ts";
import LOGGER from "./logger.ts";

export function greet(name: string): string {
  LOGGER.debug(`greet called for ${name}`);
  return `${CONFIG.GREETING_PREFIX}, ${name}`;
}
