import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyProjectLayout } from "../lib/verify/project-layout-verifier.mjs";
import { loadProjectAnalysisContext } from "../lib/verify/source-analysis.mjs";

const RULE_IDS = ["singular-feature-folders", "cross-feature-entrypoint-imports", "ambiguous-feature-filenames"];

async function verifyProject(t, files) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sha3-layout-rules-"));
  t.after(async () => rm(tempDir, { recursive: true, force: true }));

  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(tempDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, source, "utf8");
  }

  const analysisContext = await loadProjectAnalysisContext(tempDir);
  const contract = { rules: RULE_IDS.map((ruleId) => ({ id: ruleId, blocking: true })), profile: {} };
  return verifyProjectLayout(tempDir, contract, analysisContext);
}

test("verifyProjectLayout flags plural features, ambiguous names, and cross-feature internal imports", async (t) => {
  const issues = await verifyProject(t, {
    "src/users/users.service.ts": "export class UsersService {}\n",
    "src/billing/index.ts": 'export { BillingService } from "./billing.service.ts";\n',
    "src/billing/billing.service.ts": "export class BillingService {}\n",
    "src/invoice/helper.ts": "export class Helper {}\n",
    "src/invoice/invoice.service.ts":
      'import { BillingService } from "../billing/billing.service.ts";\nexport class InvoiceService { public constructor() { new BillingService(); } }\n',
  });

  assert(issues.some((issue) => issue.ruleId === "singular-feature-folders"));
  assert(issues.some((issue) => issue.ruleId === "ambiguous-feature-filenames"));
  assert(issues.some((issue) => issue.ruleId === "cross-feature-entrypoint-imports"));
});
