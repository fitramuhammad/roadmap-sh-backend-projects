import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { UrlService } from "../services/url.service";

export function createRedirectRoutes(urlService: UrlService) {
  const app = new Hono();

  app.get("/:shortCode", async (c) => {
    const { shortCode } = c.req.param();
    const url = await urlService.getUrlByShortCode(shortCode);

    if (!url) {
      throw new HTTPException(404, { message: "Short URL not found" });
    }

    await urlService.incrementVisitCount(shortCode);
    return c.redirect(url.url, 302);
  });

  return app;
}
