import type { RedisClient } from "bun";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { rateLimit } from "../middleware/rate-limit";
import type { UrlService } from "../services/url.service";

export function createShortenRoutes(
  urlService: UrlService,
  redis: RedisClient,
) {
  const app = new Hono();
  const limiter = rateLimit(redis);

  app.post("/", limiter, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const shortUrl = await urlService.createShortUrl(
      body.url,
      body.customCode,
    );
    return c.json(shortUrl, 201);
  });

  app.get("/:shortCode", async (c) => {
    const { shortCode } = c.req.param();
    const record = await urlService.getUrlByShortCode(shortCode);

    if (!record) {
      throw new HTTPException(404, { message: "Short URL not found" });
    }

    return c.json(record);
  });

  app.put("/:shortCode", async (c) => {
    const { shortCode } = c.req.param();
    const body = await c.req.json().catch(() => ({}));
    const res = await urlService.updateUrl(shortCode, body.url);

    if (!res) {
      throw new HTTPException(404, { message: "Short URL not found" });
    }

    return c.json(res);
  });

  app.delete("/:shortCode", async (c) => {
    const { shortCode } = c.req.param();
    const deleted = await urlService.deleteUrl(shortCode);

    if (!deleted) {
      throw new HTTPException(404, { message: "Short URL not found" });
    }

    return c.body(null, 204);
  });

  app.get("/:shortCode/stats", async (c) => {
    const { shortCode } = c.req.param();
    const stats = await urlService.getUrlStats(shortCode);

    if (!stats) {
      throw new HTTPException(404, { message: "Short URL not found" });
    }

    return c.json(stats);
  });

  return app;
}
