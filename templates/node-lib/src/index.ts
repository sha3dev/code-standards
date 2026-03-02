import CONFIG from "./config.ts";

export function greet(name: string): string {
  return `${CONFIG.GREETING_PREFIX}, ${name}`;
}
