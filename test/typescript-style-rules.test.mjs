import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { DEFAULT_PROFILE } from "../lib/constants.mjs";
import { loadProjectAnalysisContext } from "../lib/verify/source-analysis.mjs";
import { verifyTypeScriptStyle } from "../lib/verify/typescript-style-verifier.mjs";

const RULE_IDS = ["no-any", "explicit-export-return-types", "control-flow-braces", "type-only-imports"];

async function verifyFile(t, relativePath, source) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sha3-ts-style-"));
  t.after(async () => rm(tempDir, { recursive: true, force: true }));
  const absolutePath = path.join(tempDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, source, "utf8");
  const analysisContext = await loadProjectAnalysisContext(tempDir);
  const contract = {
    rules: RULE_IDS.map((ruleId) => ({ id: ruleId, blocking: true })),
    profile: DEFAULT_PROFILE,
  };

  return verifyTypeScriptStyle(tempDir, contract, analysisContext);
}

test("verifyTypeScriptStyle flags any, missing return types, and brace-less control flow", async (t) => {
  const issues = await verifyFile(
    t,
    "src/user/user.service.ts",
    `
import { type UserView } from "./user.types.ts";

export function readUser(input: any) {
  if (input) return input as UserView;
  return input;
}
`,
  );

  assert(issues.some((issue) => issue.ruleId === "no-any"));
  assert(issues.some((issue) => issue.ruleId === "explicit-export-return-types"));
  assert(issues.some((issue) => issue.ruleId === "control-flow-braces"));
});

test("verifyTypeScriptStyle flags imports that should be import type", async (t) => {
  const issues = await verifyFile(
    t,
    "src/user/user.service.ts",
    `
import { UserView } from "./user.types.ts";

export function readUser(): UserView {
  const result = {} as UserView;
  return result;
}
`,
  );

  assert(issues.some((issue) => issue.ruleId === "type-only-imports"));
});
