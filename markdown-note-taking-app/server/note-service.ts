import type { NoteStore } from "./note-store";
import type { MarkdownRenderer } from "./markdown-renderer";
import type { GrammarChecker } from "./grammar-checker";
import type { Note, GrammarIssue } from "./types";
import { deriveTitle } from "./title";
import { sanitizeHtml } from "./sanitize";

export class NoteNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Note not found: ${id}`);
    this.name = "NoteNotFoundError";
  }
}

export interface NoteService {
  save(markdown: string, id?: string, title?: string): Promise<Note>;
  list(): Promise<Pick<Note, "id" | "title" | "markdown" | "createdAt">[]>;
  delete(id: string): Promise<void>;
  render(id: string): Promise<string>;
  checkGrammar(id: string): Promise<GrammarIssue[]>;
}

function createId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createNoteService(
  store: NoteStore,
  renderer: MarkdownRenderer,
  grammar: GrammarChecker,
): NoteService {
  let lastCreatedAt = Date.now();

  function nextCreatedAt(): string {
    const now = Date.now();
    lastCreatedAt = now > lastCreatedAt ? now : lastCreatedAt + 1;
    return new Date(lastCreatedAt).toISOString();
  }

  return {
    async save(markdown: string, id?: string, title?: string): Promise<Note> {
      const finalTitle = title?.trim() || deriveTitle(markdown);

      const existing = id ? await store.find(id) : null;
      const finalId = id || createId();
      const createdAt = existing ? existing.createdAt : nextCreatedAt();

      const note: Note = { id: finalId, title: finalTitle, markdown, createdAt };
      await store.save(note);
      return note;
    },

    async list(): Promise<
      Pick<Note, "id" | "title" | "markdown" | "createdAt">[]
    > {
      return store.list();
    },

    async render(id: string): Promise<string> {
      const note = await store.find(id);
      if (!note) throw new NoteNotFoundError(id);
      return sanitizeHtml(renderer.render(note.markdown));
    },

    async delete(id: string): Promise<void> {
      const note = await store.find(id);
      if (!note) throw new NoteNotFoundError(id);
      await store.delete(id);
    },

    async checkGrammar(id: string): Promise<GrammarIssue[]> {
      const note = await store.find(id);
      if (!note) throw new NoteNotFoundError(id);
      const plainText = note.markdown.replace(/[#*`>_~\[\]]/g, "");
      return grammar.check(plainText);
    },
  };
}
