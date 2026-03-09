import { spawnSync } from "node:child_process";

function runGit(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

function parseChangedFiles(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function readChangedFiles(targetPath, options = {}) {
  const hasGit = runGit(["rev-parse", "--is-inside-work-tree"], targetPath);
  if (hasGit.status !== 0) {
    return { available: false, files: [], reason: "git repository not available" };
  }

  if (options.allFiles) {
    return { available: true, files: [], reason: "all-files" };
  }

  const args = options.staged
    ? ["diff", "--name-only", "--cached", options.changedAgainst ?? "HEAD"]
    : options.changedAgainst
      ? ["diff", "--name-only", options.changedAgainst]
      : ["diff", "--name-only", "HEAD"];
  const result = runGit(args, targetPath);

  if (result.status !== 0) {
    return { available: false, files: [], reason: result.stderr.trim() || "unable to compute git diff" };
  }

  return { available: true, files: parseChangedFiles(result.stdout), reason: options.staged ? "staged" : (options.changedAgainst ?? "HEAD") };
}
