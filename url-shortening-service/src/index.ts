import { Hono } from "hono";
import { logger } from "hono/logger";
import shortenRoutes from "./routes/shorten";
import redirectRoutes from "./routes/redirect";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();

app.use("*", logger());

// API routes
app.route("/api/shorten", shortenRoutes);

// Redirect routes (must be last, catches /:shortCode)
app.route("/", redirectRoutes);

app.onError(errorHandler);

const port = parseInt(process.env.PORT ?? "3000", 10);

console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
