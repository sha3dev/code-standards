import { createServer } from "node:http";
import { DEFAULT_PORT, EXTERNAL_STATUS_URL, RESPONSE_CONTENT_TYPE } from "./config.js";

export function buildServer() {
  return createServer((_, response) => {
    response.statusCode = 200;
    response.setHeader("content-type", RESPONSE_CONTENT_TYPE);
    response.end(JSON.stringify({ ok: true, statusSource: EXTERNAL_STATUS_URL }));
  });
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? String(DEFAULT_PORT));
  const server = buildServer();
  server.listen(port, () => {
    console.log(`service listening on http://localhost:${port}`);
  });
}
