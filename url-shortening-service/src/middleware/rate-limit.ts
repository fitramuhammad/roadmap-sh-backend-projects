import type { RedisClient } from "bun";
import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end

return {current, ttl}
`;

type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
};

function getClientIp(c: Context): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwardedFor = c.req.header("x-forwarded-for");
    const firstIp = forwardedFor?.split(",")[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function rateLimit(
  redis: RedisClient,
  options: RateLimitOptions = {},
): MiddlewareHandler {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options.max ?? DEFAULT_MAX_REQUESTS;
  const keyPrefix = options.keyPrefix ?? "rate-limit";

  return async (c, next) => {
    const clientIp = getClientIp(c);
    const key = `${keyPrefix}:${clientIp}`;

    const result = (await redis.send("EVAL", [
      RATE_LIMIT_SCRIPT,
      "1",
      key,
      String(windowMs),
    ])) as [number, number];

    const count = Number(result[0]);
    const ttlMs = Number(result[1]);

    if (count > max) {
      const retryAfter = Math.max(1, Math.ceil(ttlMs / 1000));
      c.header("Retry-After", String(retryAfter));

      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests, try again later",
          },
        },
        429,
      );
    }

    await next();
  };
}
