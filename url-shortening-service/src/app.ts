import type { RedisClient } from "bun";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { serveStatic } from "hono/bun";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { Db } from "./db";
import { errorHandler } from "./middleware/error-handler";
import { createRedirectRoutes } from "./routes/redirect";
import { createShortenRoutes } from "./routes/shorten";
import { createUrlService } from "./services/url.service";
import { withTimeout } from "./utils/timeout";

const MAX_BODY_SIZE = 16 * 1024;
const HEALTH_CHECK_TIMEOUT_MS = 500;

export function createApp(db: Db, redis: RedisClient) {
  const app = new Hono();
  const urlService = createUrlService(db);

  app.use("*", requestId());

  if (process.env.NODE_ENV !== "production") {
    app.use("*", logger());
  }

  app.use("*", secureHeaders());
  app.use(
    "*",
    bodyLimit({
      maxSize: MAX_BODY_SIZE,
      onError: (c) =>
        c.json(
          {
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Request body must not exceed 16 KB",
            },
          },
          413,
        ),
    }),
  );

  app.get("/health", async (c) => {
    let databaseOk = true;

    try {
      db.get(sql`select 1`);
    } catch (error) {
      console.error(error);
      databaseOk = false;
    }

    let redisOk = true;

    try {
      await withTimeout(
        redis.ping(),
        HEALTH_CHECK_TIMEOUT_MS,
        "Redis health check timed out",
      );
    } catch {
      redisOk = false;
    }

    const checks = {
      database: databaseOk ? "ok" : "unavailable",
      redis: redisOk ? "ok" : "unavailable",
    };

    if (!databaseOk) {
      return c.json({ status: "error", checks }, 503);
    }

    if (!redisOk) {
      return c.json({ status: "degraded", checks }, 200);
    }

    return c.json({ status: "ok", checks });
  });

  app.route("/api/shorten", createShortenRoutes(urlService, redis));
  app.use("*", serveStatic({ root: "./public" }));
  app.route("/", createRedirectRoutes(urlService));
  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Not Found" } }, 404),
  );
  app.onError(errorHandler);

  return app;
}
