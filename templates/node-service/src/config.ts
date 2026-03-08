import "dotenv/config";

const env = process.env;

const config = {
  RESPONSE_CONTENT_TYPE: env.RESPONSE_CONTENT_TYPE || "application/json",
  DEFAULT_PORT: Number(env.PORT || 3000),
  EXTERNAL_STATUS_URL: env.EXTERNAL_STATUS_URL || "https://status.example.com/health",
} as const;

export default config;
