import assert from "node:assert/strict";
import test from "node:test";

import { GreeterService } from "../src/index.ts";

test("GreeterService greets with the configured prefix", () => {
  const greeterService = GreeterService.createDefault();

  assert.equal(greeterService.greet("world"), "Hello, world");
});
