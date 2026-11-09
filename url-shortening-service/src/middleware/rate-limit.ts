import type { RedisClient } from "bun";
import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";
import { withTimeout } from "../utils/timeout";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_KEY_PREFIX = "url-shortener:rate-limit";
const REDIS_TIMEOUT_MS = 500;
const REDIS_RETRY_COOLDOWN_MS = 30_000;
const MAX_FALLBACK_ENTRIES = 10_000;

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

type RateLimitResult = {
  count: number;
  ttlMs: number;
};

type FallbackBucket = {
  count: number;
  resetAt: number;
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

function createFallbackStore(windowMs: number) {
  const buckets = new Map<string, FallbackBucket>();

  return {
    consume(key: string): RateLimitResult {
      const now = Date.now();
      let bucket = buckets.get(key);

      if (!bucket || now >= bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }

      bucket.count += 1;

      if (buckets.size > MAX_FALLBACK_ENTRIES) {
        for (const [entryKey, entry] of buckets) {
          if (now >= entry.resetAt) {
            buckets.delete(entryKey);
          }
        }

        while (buckets.size > MAX_FALLBACK_ENTRIES) {
          const oldestKey = buckets.keys().next().value;

          if (oldestKey === undefined) {
            break;
          }

          buckets.delete(oldestKey);
        }
      }

      return {
        count: bucket.count,
        ttlMs: Math.max(0, bucket.resetAt - now),
      };
    },
  };
}

async function consumeRedis(
  redis: RedisClient,
  key: string,
  windowMs: number,
): Promise<RateLimitResult> {
  const result: unknown = await withTimeout(
    redis.send("EVAL", [RATE_LIMIT_SCRIPT, "1", key, String(windowMs)]),
    REDIS_TIMEOUT_MS,
    "Redis rate limit command timed out",
  );

  if (!Array.isArray(result) || result.length < 2) {
    throw new Error("Unexpected Redis rate limit response");
  }

  const count = Number(result[0]);
  const ttlMs = Number(result[1]);

  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error("Unexpected Redis rate limit response");
  }

  return { count, ttlMs };
}

export function rateLimit(
  redis: RedisClient,
  options: RateLimitOptions = {},
): MiddlewareHandler {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options.max ?? DEFAULT_MAX_REQUESTS;
  const keyPrefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX;
  const fallback = createFallbackStore(windowMs);
  let redisRetryAt = 0;
  let hasLoggedFallback = false;

  return async (c, next) => {
    const clientIp = getClientIp(c);
    const key = `${keyPrefix}:${clientIp}`;
    let result: RateLimitResult;

    if (redis.connected || Date.now() >= redisRetryAt) {
      try {
        result = await consumeRedis(redis, key, windowMs);
        hasLoggedFallback = false;
      } catch (error) {
        redisRetryAt = Date.now() + REDIS_RETRY_COOLDOWN_MS;

        if (!hasLoggedFallback) {
          console.warn(
            "Redis rate limiter unavailable, using in-memory fallback",
            error instanceof Error ? error.message : error,
          );
          hasLoggedFallback = true;
        }

        result = fallback.consume(key);
      }
    } else {
      result = fallback.consume(key);
    }

    if (result.count > max) {
      const retryAfter = Math.max(1, Math.ceil(result.ttlMs / 1000));
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
