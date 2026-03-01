import CONFIG from "./config.js";

export function greet(name: string): string {
  return `${CONFIG.GREETING_PREFIX}, ${name}`;
}
