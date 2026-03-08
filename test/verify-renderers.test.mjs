import assert from "node:assert/strict";
import test from "node:test";

import { renderJsonReport } from "../lib/verify/render-json-report.mjs";
import { renderTextReport } from "../lib/verify/render-text-report.mjs";

test("renderTextReport formats issues with rule id and path", () => {
  const output = renderTextReport({
    ok: false,
    issues: [
      {
        ruleId: "single-return",
        category: "source-rule",
        severity: "error",
        message: "functions and methods in src/ must use a single return statement",
        relativePath: "src/user/user.service.ts",
        enforcedBy: "verify",
      },
    ],
    summary: {
      issueCount: 1,
      checkedRuleIds: ["single-return"],
      checkedFiles: ["src/user/user.service.ts"],
    },
  });

  assert.equal(output, "- [single-return] src/user/user.service.ts: functions and methods in src/ must use a single return statement");
});

test("renderJsonReport returns stable parseable JSON", () => {
  const report = {
    ok: true,
    issues: [],
    summary: {
      issueCount: 0,
      checkedRuleIds: ["contract-presence"],
      checkedFiles: ["AGENTS.md"],
    },
  };

  const output = renderJsonReport(report);

  assert.deepEqual(JSON.parse(output), report);
});
