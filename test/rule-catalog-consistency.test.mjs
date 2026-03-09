import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");

test("rule catalog rules declare implementation metadata", async () => {
  const catalog = JSON.parse(await readFile(path.join(repoRoot, "resources", "ai", "rule-catalog.json"), "utf8"));

  for (const rule of catalog.rules) {
    assert(Array.isArray(rule.implementedBy) && rule.implementedBy.length > 0, `${rule.id} must declare implementedBy`);
    assert(typeof rule.verificationMode === "string", `${rule.id} must declare verificationMode`);
    assert(typeof rule.confidence === "string", `${rule.id} must declare confidence`);
  }
});
