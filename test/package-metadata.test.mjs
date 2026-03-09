import assert from "node:assert/strict";
import test from "node:test";

import { getRelativeProfilePath, refreshPackageDependencyVersions, updateCodeStandardsMetadata } from "../lib/project/package-metadata.mjs";

test("getRelativeProfilePath returns repo-relative paths only", () => {
  assert.equal(getRelativeProfilePath("profiles/team.profile.json", "/repo"), "profiles/team.profile.json");
  assert.equal(getRelativeProfilePath("/outside/profile.json", "/repo"), null);
  assert.equal(getRelativeProfilePath("../shared/profile.json", "/repo"), null);
  assert.equal(getRelativeProfilePath(null, "/repo"), null);
});

test("updateCodeStandardsMetadata writes canonical metadata fields", () => {
  const projectPackageJson = {
    name: "demo",
    codeStandards: {
      contractVersion: "v0",
      template: "node-lib",
      profilePath: "profiles/old.profile.json",
      withAiAdapters: true,
    },
  };

  const updatedPackageJson = updateCodeStandardsMetadata(projectPackageJson, {
    template: "node-service",
    profilePath: "profiles/new.profile.json",
    withAiAdapters: false,
    lastRefactorWith: "0.9.0",
  });

  assert.deepEqual(updatedPackageJson.codeStandards, {
    contractVersion: "v1",
    template: "node-service",
    profilePath: "profiles/new.profile.json",
    withAiAdapters: false,
    lastRefactorWith: "0.9.0",
  });
});

test("refreshPackageDependencyVersions upgrades registry dependencies and preserves special ranges", async () => {
  const projectPackageJson = {
    dependencies: {
      "@sha3/crypto": "^1.0.0",
      "local-lib": "file:../local-lib",
    },
    devDependencies: {
      "@sha3/code-standards": "^0.1.0",
      typescript: "~5.0.0",
    },
  };

  const refreshedPackageJson = await refreshPackageDependencyVersions(projectPackageJson, {
    cwd: "/repo",
    codeStandardsVersion: "0.24.0",
    resolveLatestVersion: async (dependencyName) => {
      if (dependencyName === "@sha3/crypto") {
        return "1.4.0";
      }

      if (dependencyName === "typescript") {
        return "5.9.0";
      }

      return null;
    },
  });

  assert.equal(refreshedPackageJson.dependencies["@sha3/crypto"], "^1.4.0");
  assert.equal(refreshedPackageJson.dependencies["local-lib"], "file:../local-lib");
  assert.equal(refreshedPackageJson.devDependencies["@sha3/code-standards"], "^0.24.0");
  assert.equal(refreshedPackageJson.devDependencies.typescript, "~5.9.0");
});
