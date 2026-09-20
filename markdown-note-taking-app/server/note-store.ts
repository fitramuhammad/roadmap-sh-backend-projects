import type { Note } from "./types";

export interface NoteStore {
  save(note: Note): Promise<void>;
  find(id: string): Promise<Note | null>;
  list(): Promise<Pick<Note, "id" | "title" | "markdown" | "createdAt">[]>;
  delete(id: string): Promise<void>;
}
