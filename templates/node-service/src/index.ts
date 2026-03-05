import { createServer } from "node:http";
import CONFIG from "./config.ts";
import LOGGER from "./logger.ts";

export type ServiceStatusPayload = { ok: true; statusSource: string };

export function buildServer() {
  return createServer((_, response) => {
    const payload: ServiceStatusPayload = { ok: true, statusSource: CONFIG.EXTERNAL_STATUS_URL };
    response.statusCode = 200;
    response.setHeader("content-type", CONFIG.RESPONSE_CONTENT_TYPE);
    response.end(JSON.stringify(payload));
  });
}

export function startServer() {
  const server = buildServer();
  server.listen(CONFIG.DEFAULT_PORT, () => {
    LOGGER.info(`service listening on http://localhost:${CONFIG.DEFAULT_PORT}`);
  });
  return server;
}
