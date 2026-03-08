import "dotenv/config";

const env = process.env;

const config = {
  RESPONSE_CONTENT_TYPE: env.RESPONSE_CONTENT_TYPE || "application/json",
  DEFAULT_PORT: Number(env.PORT || 3000),
  SERVICE_NAME: env.SERVICE_NAME || "{{packageName}}",
} as const;

export default config;
