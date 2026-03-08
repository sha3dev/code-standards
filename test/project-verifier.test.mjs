import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { AI_ADAPTER_FILES, README_REQUIRED_HEADINGS } from "../lib/constants.mjs";
import { verifyProject } from "../lib/verify/project-verifier.mjs";

async function createMinimalNodeLibProject(t, withAiAdaptersInMetadata, withAiAdaptersInContract) {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "sha3-project-verifier-"));
  t.after(async () => rm(targetDir, { recursive: true, force: true }));

  await mkdir(path.join(targetDir, "src", "greeter"), { recursive: true });
  await mkdir(path.join(targetDir, "test"), { recursive: true });
  await mkdir(path.join(targetDir, "ai"), { recursive: true });

  const contract = {
    formatVersion: "v1",
    generatedByVersion: "0.9.0",
    project: {
      name: "demo-lib",
      template: "node-lib",
      withAiAdapters: withAiAdaptersInContract,
    },
    profile: {
      comment_section_blocks: [],
    },
    managedFiles: ["AGENTS.md", "ai/contract.json"],
    rules: [],
  };

  await writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo-lib",
        type: "module",
        codeStandards: {
          contractVersion: "v1",
          template: "node-lib",
          withAiAdapters: withAiAdaptersInMetadata,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(path.join(targetDir, "AGENTS.md"), "# Agents\n", "utf8");
  await writeFile(path.join(targetDir, "ai", "contract.json"), `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  await writeFile(path.join(targetDir, "src", "config.ts"), 'const config = { GREETING_PREFIX: "Hello" } as const;\n\nexport default config;\n', "utf8");
  await writeFile(path.join(targetDir, "src", "greeter", "greeter.service.ts"), "export class GreeterService {}\n", "utf8");
  await writeFile(path.join(targetDir, "src", "index.ts"), 'export { GreeterService } from "./greeter/greeter.service.ts";\n', "utf8");
  await writeFile(path.join(targetDir, "test", "greeter.test.ts"), 'import test from "node:test";\n\ntest("placeholder", () => {});\n', "utf8");
  await writeFile(path.join(targetDir, "README.md"), `${README_REQUIRED_HEADINGS.join("\n\n")}\n`, "utf8");

  if (withAiAdaptersInContract) {
    for (const adapterName of AI_ADAPTER_FILES) {
      await writeFile(path.join(targetDir, "ai", adapterName), `# ${adapterName}\n`, "utf8");
    }
  }

  return targetDir;
}

test("verifyProject flags withAiAdapters metadata mismatch", async (t) => {
  const targetDir = await createMinimalNodeLibProject(t, false, true);

  const errors = await verifyProject(targetDir);

  assert(errors.some((error) => error.includes("package.json.codeStandards.withAiAdapters must match ai/contract.json project.withAiAdapters")));
});
