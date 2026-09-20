import type { Note, GrammarIssue } from "../../server/types";

export interface NoteState {
  notes: Note[];
  activeNoteId: string;
  activeTitle: string;
  activeMarkdown: string;
  searchQuery: string;
  viewMode: "split" | "editor" | "preview";
  isGrammarOpen: boolean;
  grammarIssues: GrammarIssue[];
}

export type NoteAction =
  | { type: "SET_NOTES"; payload: Note[] }
  | { type: "CREATE_NOTE" }
  | { type: "REMOVE_NOTE"; payload: string }
  | { type: "SELECT_NOTE"; payload: Note }
  | { type: "SET_ACTIVE_TITLE"; payload: string }
  | { type: "SET_ACTIVE_MARKDOWN"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: "split" | "editor" | "preview" }
  | { type: "TOGGLE_GRAMMAR" }
  | { type: "SET_GRAMMAR_OPEN"; payload: boolean }
  | { type: "CHECK_GRAMMAR"; payload: GrammarIssue[] }
  | { type: "APPLY_GRAMMAR_FIX"; payload: GrammarIssue }
  | { type: "DISMISS_GRAMMAR_ISSUE"; payload: string }
  | { type: "UPLOAD_NOTE"; payload: { markdown: string } };