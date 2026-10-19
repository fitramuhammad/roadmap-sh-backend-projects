import { Hono } from "hono";
import {
  createShortUrl,
  getUrlByShortCode,
  updateUrl,
  deleteUrl,
  getUrlStats,
} from "../services/url.service";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const shortUrl = await createShortUrl(body.url, body.customCode);
  return c.json(shortUrl, 201);
});

app.get("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const record = await getUrlByShortCode(shortCode);

  if (!record) {
    throw new HTTPException(404, { message: "Short URL not found" });
  }

  return c.json(record);
});

app.put("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const res = await updateUrl(shortCode, body.url);

  if (!res) {
    throw new HTTPException(404, { message: "Short URL not found" });
  }

  return c.json(res);
});

app.delete("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const deleted = await deleteUrl(shortCode);

  if (!deleted) {
    throw new HTTPException(404, { message: "Short URL not found" });
  }

  return c.body(null, 204);
});

app.get("/:shortCode/stats", async (c) => {
  const { shortCode } = c.req.param();
  const stats = await getUrlStats(shortCode);

  if (!stats) {
    throw new HTTPException(404, { message: "Short URL not found" });
  }

  return c.json(stats);
});

export default app;
