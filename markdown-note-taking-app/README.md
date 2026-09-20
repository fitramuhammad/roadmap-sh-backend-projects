# Markdown note-taking app

A REST API that saves, lists, renders, and grammar-checks markdown notes. Built with TypeScript and Bun.

## Setup

```bash
bun install
```

## Run

```bash
bun run dev   # watch mode
bun run start # production
```

## Test

```bash
bun test
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/notes` | Save a note. Send raw markdown as the body, or a file upload in a `file` field (multipart). Returns `{ id, title, createdAt }`. |
| `GET` | `/notes` | List all saved notes. Returns `[{ id, title, createdAt }]`. |
| `GET` | `/notes/:id` | Render a note as HTML. |
| `POST` | `/notes/:id/grammar` | Check grammar. Returns `{ issues: [{ offset, length, message, suggestions }] }`. |

## Grammar checker

By default the app calls the public LanguageTool API at `https://api.languagetool.org`. That endpoint rate-limits to 20 requests per minute. To use a self-hosted instance, set:

```bash
LANGUAGETOOL_URL=http://localhost:8010
```

To change the language (default `en-US`):

```bash
LANGUAGETOOL_LANG=de-DE
```

## Data

Notes are stored under `./data/notes/` as pairs of files: `<id>.md` (markdown) and `<id>.json` (metadata).
