import { createServer } from "node:http";
import CONFIG from "./config.ts";

export function buildServer() {
  return createServer((_, response) => {
    response.statusCode = 200;
    response.setHeader("content-type", CONFIG.RESPONSE_CONTENT_TYPE);
    response.end(JSON.stringify({ ok: true, statusSource: CONFIG.EXTERNAL_STATUS_URL }));
  });
}

if (process.env.NODE_ENV !== "test") {
  const server = buildServer();
  server.listen(CONFIG.DEFAULT_PORT, () => {
    console.log(`service listening on http://localhost:${CONFIG.DEFAULT_PORT}`);
  });
}
