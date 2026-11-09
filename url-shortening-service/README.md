# URL Shortener

A small URL shortening service built with Bun, Hono, Drizzle ORM, and SQLite. It includes a browser UI, custom short codes, visit counts, and link deletion.

This is learning project. It has no authentication.

## Stack

- Bun
- Hono
- Drizzle ORM
- SQLite
- Redis for rate limiting, with an in-memory fallback
- Vanilla HTML, CSS, and JavaScript

## Requirements

- Bun 1.4 or newer
- Redis (optional)

## Setup

```bash
bun install
bun run dev
```

Open <http://localhost:3000>.

The app creates `data.db` and runs migrations automatically on startup. After changing the database schema, run `bun run db:generate` to create a new migration. If Redis is not running, the app still works and uses an in-memory rate limiter.

Create a `.env` file only if you want to change the defaults:

```env
PORT=3000
DB_FILE_NAME=data.db
REDIS_URL=redis://localhost:6379
TRUST_PROXY=false
NODE_ENV=development
```

Set `TRUST_PROXY=true` only when the app runs behind a trusted reverse proxy.

## Scripts

| Command               | Description                 |
| --------------------- | --------------------------- |
| `bun run dev`         | Start with hot reload       |
| `bun run start`       | Start without hot reload    |
| `bun test`            | Run tests                   |
| `bun run lint`        | Run Biome linter            |
| `bun run format`      | Format with Biome           |
| `bun run check`       | Run Biome checks            |
| `bun run db:generate` | Generate Drizzle migrations |

## API

| Method   | Path                            | Description                |
| -------- | ------------------------------- | -------------------------- |
| `POST`   | `/api/shorten`                  | Create a short URL         |
| `GET`    | `/api/shorten/:shortCode`       | Get link details           |
| `PUT`    | `/api/shorten/:shortCode`       | Update the target URL      |
| `DELETE` | `/api/shorten/:shortCode`       | Delete a link              |
| `GET`    | `/api/shorten/:shortCode/stats` | Get visit count            |
| `GET`    | `/:shortCode`                   | Redirect to the target URL |
| `GET`    | `/health`                       | Health check               |

Create a link:

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","customCode":"example"}'
```

Omit `customCode` to generate a random 7-character code.

Errors use this shape:

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "URL must be a valid http or https URL"
  }
}
```

## Limitations

- No authentication. Anyone who knows a short code can update or delete it.
- SQLite is intended for a single instance.
- Redirects use status 302 so every visit is counted.
