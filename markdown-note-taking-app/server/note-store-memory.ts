import type { Note } from "./types";
import type { NoteStore } from "./note-store";

export class InMemoryNoteStore implements NoteStore {
  private notes = new Map<string, Note>();

  async save(note: Note): Promise<void> {
    this.notes.set(note.id, note);
  }

  async find(id: string): Promise<Note | null> {
    return this.notes.get(id) ?? null;
  }

  async list(): Promise<Pick<Note, "id" | "title" | "markdown" | "createdAt">[]> {
    return Array.from(this.notes.values())
      .map(({ id, title, markdown, createdAt }) => ({ id, title, markdown, createdAt }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string): Promise<void> {
    this.notes.delete(id);
  }
}
