import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import shortenRoutes from "./routes/shorten";
import redirectRoutes from "./routes/redirect";

const app = new Hono();

app.use("*", logger());

// API routes
app.route("/api/shorten", shortenRoutes);

// Redirect routes (must be last, catches /:shortCode)
app.route("/", redirectRoutes);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: { code: err.status, message: err.message } }, err.status);
  }

  console.error(err);
  return c.json({ error: { code: 500, message: "Internal Server Error" } }, 500);
});

const port = parseInt(process.env.PORT ?? "3000", 10);

console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};

