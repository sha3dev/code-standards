/**
 * @file Service runtime configuration module.
 * @description Centralizes environment-based defaults for service execution.
 */

/**
 * imports
 */

import "dotenv/config";

/**
 * consts
 */

const env = process.env;

/**
 * env vars and defaults
 */

const CONFIG = {
  RESPONSE_CONTENT_TYPE: env.RESPONSE_CONTENT_TYPE || "application/json",
  DEFAULT_PORT: Number(env.PORT || 3000),
  EXTERNAL_STATUS_URL: env.EXTERNAL_STATUS_URL || "https://status.example.com/health"
} as const;

export default CONFIG;
