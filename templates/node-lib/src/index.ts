import { GREETING_PREFIX } from "./config.js";

export function greet(name: string): string {
  return `${GREETING_PREFIX}, ${name}`;
}
