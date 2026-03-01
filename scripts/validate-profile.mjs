import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const schemaPath = path.join(repoRoot, "profiles", "schema.json");
const profilePath = path.join(repoRoot, "profiles", "default.profile.json");

const [schemaRaw, profileRaw] = await Promise.all([
  readFile(schemaPath, "utf8"),
  readFile(profilePath, "utf8")
]);

const schema = JSON.parse(schemaRaw);
const profile = JSON.parse(profileRaw);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
const valid = validate(profile);

if (!valid) {
  console.error("profiles/default.profile.json does not match profiles/schema.json");

  for (const issue of validate.errors ?? []) {
    console.error(`- ${issue.instancePath || "/"}: ${issue.message ?? "invalid"}`);
  }

  process.exit(1);
}

console.log("profile validation passed");
