import { RedisClient } from "bun";
import { createApp } from "./app";
import { createDb } from "./db";
import { runMigrations } from "./db/migrate";

const { db, sqlite } = createDb(process.env.DB_FILE_NAME ?? "data.db");

runMigrations(db);

const redis = new RedisClient(
  process.env.REDIS_URL ?? "redis://localhost:6379",
);
await redis.connect();

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const app = createApp(db, redis);

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server running on http://localhost:${port}`);

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down`);

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
