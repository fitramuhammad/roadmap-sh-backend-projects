import { Hono } from "hono";
import {
  getUrlByShortCode,
  incrementVisitCount,
} from "../services/url.service";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

app.get("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const url = await getUrlByShortCode(shortCode);

  if (!url) {
    throw new HTTPException(404, { message: "Not Found" });
  }

  await incrementVisitCount(shortCode);
  return c.redirect(url.url, 302);
});

export default app;
