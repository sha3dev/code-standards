import { verifyProject } from "../verify/project-verifier.mjs";

export async function runVerify(rawOptions) {
  if (rawOptions.help) {
    const { printUsage } = await import("./parse-args.mjs");
    printUsage();
    return;
  }

  const targetPath = process.cwd();
  const errors = await verifyProject(targetPath);

  if (errors.length === 0) {
    console.log("standards verification passed");
    return;
  }

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  throw new Error(`Verification failed with ${errors.length} issue(s).`);
}
