import { SqliteNoteStore } from "./note-store-sqlite";
import { MarkedRenderer } from "./markdown-renderer";
import { LanguageToolChecker } from "./grammar-checker-lt";
import { createNoteService, NoteNotFoundError } from "./note-service";
import homepage from "../public/index.html";

const store = new SqliteNoteStore("./data/notes.db");
const renderer = new MarkedRenderer();
const grammar = new LanguageToolChecker(
  process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org",
  process.env.LANGUAGETOOL_LANG ?? "en-US",
);

const service = createNoteService(store, renderer, grammar);

const port = Number(process.env.PORT ?? 3000);

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function validateNoteBody(
  body: Record<string, unknown> | null,
): { markdown: string; title?: string } | null {
  if (!body || typeof body.markdown !== "string") {
    return null;
  }
  const title = typeof body.title === "string" ? body.title : undefined;
  return { markdown: body.markdown, title };
}

Bun.serve({
  port,
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/": homepage,

    "/notes": {
      async GET() {
        try {
          const notes = await service.list();
          return Response.json(notes);
        } catch (err) {
          console.error("GET /notes failed:", err);
          return jsonError(500, "Failed to list notes");
        }
      },
      async POST(req) {
        const body = await readJson(req);
        const noteBody = validateNoteBody(body);
        if (!noteBody) {
          return jsonError(400, "Invalid body: 'markdown' must be a string");
        }
        try {
          const note = await service.save(
            noteBody.markdown,
            body?.id as string | undefined,
            noteBody.title,
          );
          return Response.json(note, { status: 201 });
        } catch (err) {
          console.error("POST /notes failed:", err);
          return jsonError(500, "Failed to save note");
        }
      },
    },

    "/notes/:id": {
      async GET(req) {
        try {
          const html = await service.render(req.params.id);
          return new Response(html, {
            headers: { "Content-Type": "text/html" },
          });
        } catch (err) {
          if (err instanceof NoteNotFoundError) {
            return jsonError(404, err.message);
          }
          console.error(`GET /notes/${req.params.id} failed:`, err);
          return jsonError(500, "Failed to render note");
        }
      },
      async PUT(req) {
        const id = req.params.id;
        const body = await readJson(req);
        const noteBody = validateNoteBody(body);
        if (!noteBody) {
          return jsonError(400, "Invalid body: 'markdown' must be a string");
        }
        try {
          const note = await service.save(noteBody.markdown, id, noteBody.title);
          return Response.json(note);
        } catch (err) {
          if (err instanceof NoteNotFoundError) {
            return jsonError(404, err.message);
          }
          console.error(`PUT /notes/${id} failed:`, err);
          return jsonError(500, "Failed to update note");
        }
      },
      async DELETE(req) {
        const id = req.params.id;
        try {
          await service.delete(id);
          return new Response(null, { status: 204 });
        } catch (err) {
          if (err instanceof NoteNotFoundError) {
            return jsonError(404, err.message);
          }
          console.error(`DELETE /notes/${id} failed:`, err);
          return jsonError(500, "Failed to delete note");
        }
      },
    },

    "/notes/:id/grammar": {
      async GET(req) {
        try {
          const issues = await service.checkGrammar(req.params.id);
          return Response.json(issues);
        } catch (err) {
          if (err instanceof NoteNotFoundError) {
            return jsonError(404, err.message);
          }
          console.error(
            `GET /notes/${req.params.id}/grammar failed:`,
            err,
          );
          return jsonError(500, "Failed to check grammar");
        }
      },
    },
  },
});

console.log(`Listening on http://localhost:${port}`);