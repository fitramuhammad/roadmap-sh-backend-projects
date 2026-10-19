import { Hono } from "hono";
import {
  createShortUrl,
  getUrlByShortCode,
  updateUrl,
  deleteUrl,
  getUrlStats,
} from "../services/url.service";
import { HTTPException } from "hono/http-exception";
import { AppError } from "../utils/validate";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));

  try {
    const shortUrl = await createShortUrl(body.url, body.customCode);
    return c.json(shortUrl, 201);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    if (err instanceof AppError) {
      if (err.code === "SHORT_CODE_EXISTS") {
        throw new HTTPException(409, { message: err.code });
      }
      throw new HTTPException(400, { message: err.code });
    }
  }
});

app.get("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const record = await getUrlByShortCode(shortCode);

  if (!record) {
    throw new HTTPException(404, { message: "Record not found." });
  }

  return c.json(record);
});

app.put("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const body = await c.req.json().catch(() => ({}));

  try {
    const res = await updateUrl(shortCode, body.url);
    if (!res) {
      throw new HTTPException(404, { message: "Not Found" });
    }

    return c.json(res);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    if (error instanceof Error) {
      throw new HTTPException(400, { message: error.message });
    }
  }
});

app.delete("/:shortCode", async (c) => {
  const { shortCode } = c.req.param();
  const deleted = await deleteUrl(shortCode);

  if (!deleted) {
    throw new HTTPException(404, { message: "Not Found" });
  }

  return c.body(null, 204);
});

app.get("/:shortCode/stats", async (c) => {
  const { shortCode } = c.req.param();
  const stats = await getUrlStats(shortCode);

  if (!stats) {
    throw new HTTPException(404, { message: "Not Found" });
  }

  return c.json(stats);
});

export default app;
