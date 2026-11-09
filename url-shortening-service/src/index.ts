import { RedisClient } from "bun";
import { createApp } from "./app";
import { createDb } from "./db";
import { runMigrations } from "./db/migrate";
import { withTimeout } from "./utils/timeout";

const REDIS_CONNECT_TIMEOUT_MS = 3000;
const REDIS_RECONNECT_INTERVAL_MS = 5000;

const { db, sqlite } = createDb(process.env.DB_FILE_NAME ?? "data.db");

runMigrations(db);

let isShuttingDown = false;
let isConnecting = false;
let lastRedisErrorLog = 0;

const redis = new RedisClient(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    connectionTimeout: 2000,
    autoReconnect: false,
    enableOfflineQueue: false,
  },
);

redis.onconnect = () => {
  console.log("Redis connected");
};

redis.onclose = (error) => {
  if (isShuttingDown) {
    return;
  }

  const now = Date.now();

  if (now - lastRedisErrorLog >= 60_000) {
    console.warn("Redis connection closed:", error.message);
    lastRedisErrorLog = now;
  }
};

async function connectRedis(): Promise<boolean> {
  if (redis.connected) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  isConnecting = true;

  try {
    await withTimeout(
      redis.connect(),
      REDIS_CONNECT_TIMEOUT_MS,
      "Redis connection timed out",
    );
    return true;
  } catch {
    return false;
  } finally {
    isConnecting = false;
  }
}

const redisConnected = await connectRedis();

if (!redisConnected) {
  console.warn(
    `Redis is unavailable, rate limiting will use the in-memory fallback and retry every ${REDIS_RECONNECT_INTERVAL_MS / 1000} seconds`,
  );
}

const redisReconnectTimer = setInterval(() => {
  if (!isShuttingDown) {
    void connectRedis();
  }
}, REDIS_RECONNECT_INTERVAL_MS);

redisReconnectTimer.unref();

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const app = createApp(db, redis);

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server running on http://localhost:${port}`);

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down`);

  clearInterval(redisReconnectTimer);
  await server.stop();
  redis.close();
  sqlite.close();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
