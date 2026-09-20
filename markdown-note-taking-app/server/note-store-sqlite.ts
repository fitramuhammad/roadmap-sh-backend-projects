import { Database } from "bun:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import type { Note } from "./types";
import type { NoteStore } from "./note-store";

export class SqliteNoteStore implements NoteStore {
  private db: Database;

  constructor(dbPath: string = "./data/notes.db") {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath, { create: true });
    this.init();
  }

  private init(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        markdown TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
  }

  async save(note: Note): Promise<void> {
    const query = this.db.prepare(`
      INSERT INTO notes (id, title, markdown, createdAt)
      VALUES ($id, $title, $markdown, $createdAt)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        markdown = excluded.markdown,
        createdAt = excluded.createdAt
    `);

    query.run({
      $id: note.id,
      $title: note.title,
      $markdown: note.markdown,
      $createdAt: note.createdAt,
    });
  }

  async find(id: string): Promise<Note | null> {
    const query = this.db.prepare<Note, { $id: string }>(
      "SELECT id, title, markdown, createdAt FROM notes WHERE id = $id",
    );
    const note = query.get({ $id: id });
    return note ?? null;
  }

  async list(): Promise<
    Pick<Note, "id" | "title" | "markdown" | "createdAt">[]
  > {
    const query = this.db.prepare<
      Pick<Note, "id" | "title" | "markdown" | "createdAt">,
      []
    >(
      "SELECT id, title, markdown, createdAt FROM notes ORDER BY createdAt DESC",
    );
    return query.all();
  }

  async delete(id: string): Promise<void> {
    const query = this.db.prepare("DELETE FROM notes WHERE id = $id");
    query.run({ $id: id });
  }
}
