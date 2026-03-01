import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(testDir, "../bin/code-standards.mjs");

test("cli shows help", () => {
  const result = spawnSync(process.execPath, [cliPath, "--help"], { encoding: "utf8" });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /profile/);
});
