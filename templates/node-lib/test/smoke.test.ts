import assert from "node:assert/strict";
import test from "node:test";

import { greet } from "../src/index.ts";

test("greet returns a deterministic message", () => {
  assert.equal(greet("world"), "Hello, world");
});
