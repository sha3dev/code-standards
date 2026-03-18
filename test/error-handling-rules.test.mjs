import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyErrorHandling } from "../lib/verify/error-handling-verifier.mjs";
import { loadProjectAnalysisContext } from "../lib/verify/source-analysis.mjs";

const RULE_IDS = ["typed-error-must-be-used", "no-silent-catch", "actionable-error-messages"];

function buildRule(ruleId, severity = "error") {
  return { id: ruleId, severity, enforcedBy: ["verify"] };
}

async function verifyProject(t, files) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sha3-error-rules-"));
  t.after(async () => rm(tempDir, { recursive: true, force: true }));

  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(tempDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, source, "utf8");
  }

  const analysisContext = await loadProjectAnalysisContext(tempDir);
  const contract = {
    rules: RULE_IDS.map((ruleId) => buildRule(ruleId, ruleId === "actionable-error-messages" ? "warning" : "error")),
    profile: {},
  };
  return verifyErrorHandling(tempDir, contract, analysisContext);
}

test("verifyErrorHandling flags unused typed errors and silent catches", async (t) => {
  const issues = await verifyProject(t, {
    "src/invoice/invoice.errors.ts": "export class InvoiceError extends Error {}\n",
    "src/invoice/invoice.service.ts": `
export class InvoiceService {
  public readInvoice(): string {
    try {
      throw new Error("failed");
    } catch (error) {
      const result = "fallback";
      return result;
    }
  }
}
`,
  });

  assert(issues.some((issue) => issue.ruleId === "typed-error-must-be-used"));
  assert(issues.some((issue) => issue.ruleId === "no-silent-catch"));
  assert(issues.some((issue) => issue.ruleId === "actionable-error-messages"));
});
