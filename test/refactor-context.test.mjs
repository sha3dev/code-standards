import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { REFACTOR_ANALYSIS_SUMMARY_PATH, REFACTOR_LATEST_DIR, REFACTOR_PRESERVATION_PATH, REFACTOR_PUBLIC_CONTRACT_PATH } from "../lib/constants.mjs";
import { materializeRefactorContext } from "../lib/refactor/materialize-refactor-context.mjs";

test("materializeRefactorContext snapshots the repo and skips refactor artifacts", async (t) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-refactor-context-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src"), { recursive: true });
  await mkdir(path.join(targetDir, ".code-standards", "refactor-source", "latest"), { recursive: true });
  await mkdir(path.join(targetDir, "node_modules", "demo-package"), { recursive: true });
  await writeFile(path.join(targetDir, "src", "index.ts"), "export const value = 1;\n", "utf8");
  await writeFile(path.join(targetDir, ".code-standards", "refactor-source", "latest", "stale.txt"), "stale\n", "utf8");
  await writeFile(path.join(targetDir, "node_modules", "demo-package", "index.js"), "module.exports = {};\n", "utf8");

  const publicContract = { template: "node-lib" };
  const preservation = { publicApi: true };
  const analysisSummary = "# Summary";

  const result = await materializeRefactorContext(targetDir, publicContract, preservation, analysisSummary);

  assert.equal(await readFile(path.join(targetDir, REFACTOR_LATEST_DIR, "src", "index.ts"), "utf8"), "export const value = 1;\n");
  await assert.rejects(() => readFile(path.join(targetDir, REFACTOR_LATEST_DIR, ".code-standards", "refactor-source", "latest", "stale.txt"), "utf8"));
  await assert.rejects(() => readFile(path.join(targetDir, REFACTOR_LATEST_DIR, "node_modules", "demo-package", "index.js"), "utf8"));
  assert.equal(await readFile(path.join(targetDir, REFACTOR_PUBLIC_CONTRACT_PATH), "utf8"), `${JSON.stringify(publicContract, null, 2)}\n`);
  assert.equal(await readFile(path.join(targetDir, REFACTOR_PRESERVATION_PATH), "utf8"), `${JSON.stringify(preservation, null, 2)}\n`);
  assert.equal(await readFile(path.join(targetDir, REFACTOR_ANALYSIS_SUMMARY_PATH), "utf8"), "# Summary\n");
  assert.equal(result.latestReferenceDir, path.join(targetDir, REFACTOR_LATEST_DIR));
});
