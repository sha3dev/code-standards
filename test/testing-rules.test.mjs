import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadProjectAnalysisContext } from "../lib/verify/source-analysis.mjs";
import { verifyTestingRules } from "../lib/verify/testing-verifier.mjs";

const RULE_IDS = ["node-test-runner-only", "assert-strict-preferred", "no-ts-ignore-bypass", "behavior-change-tests"];

async function verifyProject(t, files, changedFilesContext) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sha3-testing-rules-"));
  t.after(async () => rm(tempDir, { recursive: true, force: true }));

  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(tempDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, source, "utf8");
  }

  const analysisContext = await loadProjectAnalysisContext(tempDir);
  const contract = { rules: RULE_IDS.map((ruleId) => ({ id: ruleId, blocking: true })), profile: {} };
  return verifyTestingRules(tempDir, contract, analysisContext, changedFilesContext);
}

test("verifyTestingRules flags missing node imports, ignore directives, and missing changed tests", async (t) => {
  const issues = await verifyProject(
    t,
    {
      "src/user/user.service.ts": "export class UserService {}\n",
      "test/user.test.ts": '// @ts-ignore\nimport test from "vitest";\n\ntest("x", () => {});\n',
    },
    { available: true, files: ["src/user/user.service.ts"], reason: "HEAD" },
  );

  assert(issues.some((issue) => issue.ruleId === "node-test-runner-only"));
  assert(issues.some((issue) => issue.ruleId === "assert-strict-preferred"));
  assert(issues.some((issue) => issue.ruleId === "no-ts-ignore-bypass"));
  assert(issues.some((issue) => issue.ruleId === "behavior-change-tests"));
});
