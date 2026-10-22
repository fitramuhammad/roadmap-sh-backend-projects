import type { RedisClient } from "bun";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { Db } from "./db";
import { errorHandler } from "./middleware/error-handler";
import { createRedirectRoutes } from "./routes/redirect";
import { createShortenRoutes } from "./routes/shorten";
import { createUrlService } from "./services/url.service";

const MAX_BODY_SIZE = 16 * 1024;

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

  app.get("/health", (c) => {
    try {
      db.get(sql`select 1`);
      return c.json({ status: "ok" });
    } catch (error) {
      console.error(error);
      return c.json({ status: "error" }, 503);
    }
  });

  app.route("/api/shorten", createShortenRoutes(urlService, redis));
  app.route("/", createRedirectRoutes(urlService));
  app.onError(errorHandler);

  return app;
}
