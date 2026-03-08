import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");

test("template test files use TypeScript-compatible node imports", async () => {
  for (const relativePath of ["templates/node-lib/test/package-info.test.ts", "templates/node-service/test/service-runtime.test.ts"]) {
    const templateRaw = await readFile(path.join(repoRoot, relativePath), "utf8");

    assert.doesNotMatch(templateRaw, /import assert from "node:assert\/strict";/);
    assert.doesNotMatch(templateRaw, /import test from "node:test";/);
    assert.match(templateRaw, /import \* as assert from "node:assert\/strict";/);
    assert.match(templateRaw, /import \{ test \} from "node:test";/);
  }
});

test("template source files do not contain empty section placeholders", async () => {
  for (const relativePath of [
    "templates/node-lib/src/package-info/package-info.service.ts",
    "templates/node-service/src/app-info/app-info.service.ts",
    "templates/node-service/src/http/http-server.service.ts",
    "templates/node-service/src/app/service-runtime.service.ts",
  ]) {
    const templateRaw = await readFile(path.join(repoRoot, relativePath), "utf8");

    assert.doesNotMatch(templateRaw, /\/\/ empty/);
  }
});
