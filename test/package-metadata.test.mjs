import assert from "node:assert/strict";
import test from "node:test";

import { getRelativeProfilePath, updateCodeStandardsMetadata } from "../lib/project/package-metadata.mjs";

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
