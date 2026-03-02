import "dotenv/config";

const DEFAULT_CONFIG = { RESPONSE_CONTENT_TYPE: "application/json", DEFAULT_PORT: 3000, EXTERNAL_STATUS_URL: "https://status.example.com/health" } as const;

function readStringEnv(key: string, fallback: string): string {
  const rawValue = process.env[key];

  if (typeof rawValue !== "string") {
    return fallback;
  }

  const trimmedValue = rawValue.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function readIntegerEnv(key: string, fallback: number): number {
  const rawValue = process.env[key];

  if (typeof rawValue !== "string") {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

const CONFIG = {
  RESPONSE_CONTENT_TYPE: readStringEnv("RESPONSE_CONTENT_TYPE", DEFAULT_CONFIG.RESPONSE_CONTENT_TYPE),
  DEFAULT_PORT: readIntegerEnv("PORT", DEFAULT_CONFIG.DEFAULT_PORT),
  EXTERNAL_STATUS_URL: readStringEnv("EXTERNAL_STATUS_URL", DEFAULT_CONFIG.EXTERNAL_STATUS_URL)
} as const;

export default CONFIG;
