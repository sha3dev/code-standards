import "dotenv/config";

const ENV = process.env;

const config = {
  RESPONSE_CONTENT_TYPE: ENV.RESPONSE_CONTENT_TYPE || "application/json",
  DEFAULT_PORT: Number(ENV.PORT || 3000),
  SERVICE_NAME: ENV.SERVICE_NAME || "{{packageName}}",
} as const;

export default config;
