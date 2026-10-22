import type { RedisClient } from "bun";
import { createApp } from "../app";
import { createDb } from "../db";
import { runMigrations } from "../db/migrate";

function createTestRedis(): RedisClient {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    send: async (command: string, args: string[]) => {
      if (command !== "EVAL") {
        throw new Error(`Unexpected Redis command: ${command}`);
      }

      const key = args[2] ?? "unknown";
      const windowMs = Number(args[3] ?? 60_000);
      const now = Date.now();
      let bucket = buckets.get(key);

      if (!bucket || now >= bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }

      bucket.count += 1;
      return [bucket.count, bucket.resetAt - now];
    },
  } as unknown as RedisClient;
}

export function createTestApp() {
  const { db, sqlite } = createDb(":memory:");
  runMigrations(db);

  const app = createApp(db, createTestRedis());

  return {
    app,
    close: () => sqlite.close(),
  };
}
