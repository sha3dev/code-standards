import { createServer } from "node:http";

export function buildServer() {
  return createServer((_, response) => {
    response.statusCode = 200;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ ok: true }));
  });
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? "3000");
  const server = buildServer();
  server.listen(port, () => {
    console.log(`service listening on http://localhost:${port}`);
  });
}
