import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const schemaPath = path.join(repoRoot, "standards", "schema.json");
const manifestPath = path.join(repoRoot, "standards", "manifest.json");

const [schemaRaw, manifestRaw] = await Promise.all([readFile(schemaPath, "utf8"), readFile(manifestPath, "utf8")]);

const schema = JSON.parse(schemaRaw);
const manifest = JSON.parse(manifestRaw);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
const valid = validate(manifest);

if (!valid) {
  console.error("standards/manifest.json does not match standards/schema.json");

  for (const issue of validate.errors ?? []) {
    console.error(`- ${issue.instancePath || "/"}: ${issue.message ?? "invalid"}`);
  }

  process.exit(1);
}

console.log("standards manifest validation passed");
