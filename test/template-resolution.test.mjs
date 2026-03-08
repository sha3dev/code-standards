import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveTemplateForRefactor } from "../lib/project/template-resolution.mjs";

async function createTempProject(t) {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-template-resolution-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));
  return targetDir;
}

test("resolveTemplateForRefactor prefers explicit option", async (t) => {
  const targetDir = await createTempProject(t);

  const template = await resolveTemplateForRefactor({ template: "node-service" }, {}, targetDir);

  assert.equal(template, "node-service");
});

test("resolveTemplateForRefactor uses metadata template when present", async (t) => {
  const targetDir = await createTempProject(t);

  const template = await resolveTemplateForRefactor({ template: undefined }, { codeStandards: { template: "node-lib" } }, targetDir);

  assert.equal(template, "node-lib");
});

test("resolveTemplateForRefactor infers node-service from start script", async (t) => {
  const targetDir = await createTempProject(t);

  const template = await resolveTemplateForRefactor({ template: undefined }, { scripts: { start: "node --import tsx src/main.ts" } }, targetDir);

  assert.equal(template, "node-service");
});

test("resolveTemplateForRefactor infers node-lib from package shape and tsconfig.build.json", async (t) => {
  const targetDir = await createTempProject(t);
  await writeFile(path.join(targetDir, "tsconfig.build.json"), "{}\n", "utf8");

  const template = await resolveTemplateForRefactor({ template: undefined }, { main: "dist/index.js", types: "dist/index.d.ts" }, targetDir);

  assert.equal(template, "node-lib");
});

test("resolveTemplateForRefactor throws when inference fails", async (t) => {
  const targetDir = await createTempProject(t);

  await assert.rejects(() => resolveTemplateForRefactor({ template: undefined }, {}, targetDir), /Unable to infer template for refactor/);
});
