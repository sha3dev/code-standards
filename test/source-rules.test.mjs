import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { DEFAULT_PROFILE } from "../lib/constants.mjs";
import { verifySourceRules } from "../lib/verify/source-rule-verifier.mjs";

const RULE_IDS = [
  "single-return",
  "async-await-only",
  "one-public-class-per-file",
  "feature-class-only",
  "no-module-functions-in-class-files",
  "class-section-order",
  "canonical-config-import",
  "domain-specific-identifiers",
  "boolean-prefix",
  "feature-filename-role",
];

async function verifySingleFile(t, relativePath, source, activeRuleIds = RULE_IDS) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sha3-source-rules-"));
  t.after(async () => rm(tempDir, { recursive: true, force: true }));

  const absolutePath = path.join(tempDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, source, "utf8");

  const contract = {
    rules: RULE_IDS.map((ruleId) => ({
      id: ruleId,
      deterministic: activeRuleIds.includes(ruleId),
      enforcedBy: ["verify"],
      severity: "error",
    })),
    profile: { comment_section_blocks: DEFAULT_PROFILE.comment_section_blocks },
  };

  return verifySourceRules(tempDir, contract);
}

test("single-return flags multiple returns in src", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
export class UserService {
  public readValue(input: string): string {
    if (input.length === 0) {
      return "empty";
    }

    return input;
  }
}
`,
  );

  assert(errors.some((issue) => issue.ruleId === "single-return"));
});

test("async-await-only flags promise chains in src", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
export class UserService {
  public async loadUser(): Promise<void> {
    await Promise.resolve("x").then(() => undefined);
  }
}
`,
  );

  assert(errors.some((issue) => issue.ruleId === "async-await-only"));
});

test("feature-filename-role flags ambiguous feature file names", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/helper.ts",
    `
export const value = 1;
`,
  );

  assert(errors.some((issue) => issue.ruleId === "feature-filename-role"));
});

test("feature-filename-role allows .helpers.ts as an explicit feature role", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/order/order.helpers.ts",
    `
export class OrderHelpers {
  public readOrderId(): string {
    return "order-1";
  }
}
`,
  );

  assert(!errors.some((issue) => issue.ruleId === "feature-filename-role"));
});

test("one-public-class-per-file flags multiple exported classes", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
export class UserService {}
export class BillingService {}
`,
  );

  assert(errors.some((issue) => issue.ruleId === "one-public-class-per-file"));
});

test("feature-class-only flags feature files that export functions instead of one class", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
export function readUser(): string {
  return "ok";
}
`,
  );

  assert(errors.some((issue) => issue.ruleId === "feature-class-only"));
});

test("feature-class-only ignores .types.ts files", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.types.ts",
    `
export type UserStatus = "active" | "disabled";

export interface UserView {
  status: UserStatus;
}
`,
    ["feature-class-only"],
  );

  assert.equal(errors.length, 0);
});

test("no-module-functions-in-class-files flags module-scope helpers in class files", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/order/order.service.ts",
    `
function buildOrderId(): string {
  return "order-1";
}

export class OrderService {
  public readOrderId(): string {
    return buildOrderId();
  }
}
`,
  );

  assert(errors.some((issue) => issue.ruleId === "no-module-functions-in-class-files"));
});

test("class-section-order flags missing ordered sections", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
export class UserService {
  public constructor() {}

  public readStatus(): string {
    const result = "ok";
    return result;
  }
}
`,
  );

  assert(errors.some((issue) => issue.ruleId === "class-section-order"));
});

test("class-section-order flags declared empty sections", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
/**
 * @section imports:externals
 */

/**
 * @section imports:internals
 */

import config from "../config.ts";

/**
 * @section class
 */

export class UserService {
  /**
   * @section private:attributes
   */

  private readonly isEnabled: boolean;

  /**
   * @section constructor
   */

  public constructor() {
    this.isEnabled = true;
  }

  /**
   * @section public:methods
   */

  public readStatus(): string {
    return this.isEnabled ? config.STATUS : "disabled";
  }
}
`,
  );

  assert(errors.some((issue) => issue.message.includes("empty @section block must be omitted")));
});

test("class-section-order flags files without @section class before the exported class", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
/**
 * @section imports:internals
 */

import config from "../config.ts";

/**
 * @section types
 */

type UserServiceOptions = { isEnabled: boolean };

export class UserService {
  /**
   * @section private:attributes
   */

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
  );

  assert(errors.some((issue) => issue.message.includes("must declare @section class immediately before the exported class")));
});

test("canonical-config-import flags non canonical imports", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
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
  );

  assert(errors.some((issue) => issue.ruleId === "canonical-config-import"));
});

test("canonical-config-import ignores non-relative imports that end in config", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/config.ts",
    `
import "dotenv/config";

const config = { value: "ok" } as const;

export default config;
`,
    ["canonical-config-import"],
  );

  assert.equal(errors.length, 0);
});

test("boolean-prefix and domain-specific-identifiers flag poor names", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.types.ts",
    `
const ready: boolean = true;
const data = 1;

export { ready, data };
`,
  );

  assert(errors.some((issue) => issue.ruleId === "boolean-prefix"));
  assert(errors.some((issue) => issue.ruleId === "domain-specific-identifiers"));
});

test("ordered class files with canonical config imports pass source rules", async (t) => {
  const errors = await verifySingleFile(
    t,
    "src/user/user.service.ts",
    `
/**
 * @section imports:internals
 */

import config from "../config.ts";

/**
 * @section types
 */

type UserServiceOptions = {
  isEnabled: boolean;
};

/**
 * @section class
 */

export class UserService {
  /**
   * @section private:attributes
   */

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
  );

  assert.equal(errors.length, 0);
});
