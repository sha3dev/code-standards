import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ESLint } from "eslint";

import eslintBase from "../eslint/base.mjs";

async function lintText(source, filePath) {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: eslintBase, cwd: path.resolve(".") });
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages.map((message) => message.ruleId);
}

test("single-return rule flags multiple returns in src", async () => {
  const messages = await lintText(
    `
export function readValue(input: string): string {
  if (input.length === 0) {
    return "empty";
  }

  return input;
}
`,
    path.join(process.cwd(), "src", "user", "user.service.ts")
  );

  assert(messages.includes("@sha3/code-standards/single-return"));
});

test("no-promise-chains rule flags then/catch in src", async () => {
  const messages = await lintText(
    `
export async function loadUser(): Promise<void> {
  await Promise.resolve("x").then(() => undefined);
}
`,
    path.join(process.cwd(), "src", "user", "user.service.ts")
  );

  assert(messages.includes("@sha3/code-standards/no-promise-chains"));
});

test("feature filename role rule flags ambiguous feature file names", async () => {
  const messages = await lintText(
    `
export const value = 1;
`,
    path.join(process.cwd(), "src", "user", "helper.ts")
  );

  assert(messages.includes("@sha3/code-standards/feature-filename-role"));
});

test("one public class per file rule flags multiple exported classes", async () => {
  const messages = await lintText(
    `
export class UserService {}
export class BillingService {}
`,
    path.join(process.cwd(), "src", "user", "user.service.ts")
  );

  assert(messages.includes("@sha3/code-standards/one-public-class-per-file"));
});

test("class section order rule flags missing sections", async () => {
  const messages = await lintText(
    `
export class UserService {
  public constructor() {}

  public readStatus(): string {
    const result = "ok";
    return result;
  }
}
`,
    path.join(process.cwd(), "src", "user", "user.service.ts")
  );

  assert(messages.includes("@sha3/code-standards/class-section-order"));
});

test("canonical config import rule flags non canonical imports", async () => {
  const messages = await lintText(
    `
import settings from "../config.ts";

export class UserService {
  public constructor() {}

  public readStatus(): string {
    const result = settings.STATUS;
    return result;
  }
}
`,
    path.join(process.cwd(), "src", "user", "user.service.ts")
  );

  assert(messages.includes("@sha3/code-standards/canonical-config-import"));
});

test("boolean prefix and generic identifier rules flag poor names", async () => {
  const messages = await lintText(
    `
const ready: boolean = true;
const data = 1;

export { ready, data };
`,
    path.join(process.cwd(), "src", "user", "user.types.ts")
  );

  assert(messages.includes("@sha3/code-standards/boolean-prefix"));
  assert(messages.includes("@sha3/code-standards/forbidden-generic-identifiers"));
});

test("public class files with ordered sections pass custom rules", async () => {
  const messages = await lintText(
    `
/**
 * @section imports:externals
 */

/**
 * @section imports:internals
 */

import config from "../config.ts";

/**
 * @section consts
 */

/**
 * @section types
 */

type UserServiceOptions = {
  isEnabled: boolean;
};

/**
 * @section public:properties
 */

export class UserService {
  private readonly isEnabled: boolean;

  /**
   * @section constructor
   */

  public constructor(options: UserServiceOptions) {
    this.isEnabled = options.isEnabled;
  }

  /**
   * @section public:methods
   */

  public readStatus(): string {
    const result = this.isEnabled ? config.STATUS : "disabled";
    return result;
  }
}
`,
    path.join(process.cwd(), "src", "user", "user.service.ts")
  );

  assert.equal(messages.filter((ruleId) => ruleId?.startsWith("@sha3/code-standards/")).length, 0);
});
