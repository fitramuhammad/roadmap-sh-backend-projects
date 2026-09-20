import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Note, GrammarIssue } from "../../server/types";
import { NoteState, NoteAction } from "./note-types";
import { deriveTitle } from "../../server/title";

const INITIAL_NOTES: Note[] = [];

const GRAMMAR_ISSUES: GrammarIssue[] = [];

const INITIAL_STATE: NoteState = {
  notes: INITIAL_NOTES,
  activeNoteId: INITIAL_NOTES[0]?.id ?? "",
  activeTitle: INITIAL_NOTES[0]?.title ?? "",
  activeMarkdown: INITIAL_NOTES[0]?.markdown ?? "",
  searchQuery: "",
  viewMode: "split",
  isGrammarOpen: false,
  grammarIssues: GRAMMAR_ISSUES,
};

export function notesReducer(state: NoteState, action: NoteAction): NoteState {
  switch (action.type) {
    case "SET_NOTES": {
      const active = action.payload[0];
      return {
        ...state,
        notes: action.payload,
        activeNoteId: active?.id ?? "",
        activeTitle: active?.title ?? "",
        activeMarkdown: active?.markdown ?? "",
      };
    }

    case "CREATE_NOTE": {
      const newId = `note-${Date.now()}`;
      const newNote: Note = {
        id: newId,
        title: "Untitled Note",
        markdown: "# Untitled Note\n\nStart typing markdown here...",
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      return {
        ...state,
        notes: [newNote, ...state.notes],
        activeNoteId: newId,
        activeTitle: deriveTitle(newNote.markdown),
        activeMarkdown: newNote.markdown,
      };
    }

    case "SELECT_NOTE":
      return {
        ...state,
        activeNoteId: action.payload.id,
        activeTitle: action.payload.title,
        activeMarkdown: action.payload.markdown,
      };

    case "REMOVE_NOTE":
      return {
        ...state,
        activeNoteId: "",
        activeTitle: "",
        activeMarkdown: "",
        notes: state.notes.filter((note) => note.id != action.payload),
      };

    case "SET_ACTIVE_TITLE":
      return {
        ...state,
        activeTitle: action.payload,
        notes: state.notes.map((note) =>
          note.id === state.activeNoteId
            ? { ...note, title: action.payload }
            : note,
        ),
      };

    case "SET_ACTIVE_MARKDOWN":
      return {
        ...state,
        activeMarkdown: action.payload,
        notes: state.notes.map((note) =>
          note.id === state.activeNoteId
            ? { ...note, markdown: action.payload }
            : note,
        ),
      };

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload,
      };

    case "SET_VIEW_MODE":
      return {
        ...state,
        viewMode: action.payload,
      };

    case "TOGGLE_GRAMMAR":
      return {
        ...state,
        isGrammarOpen: !state.isGrammarOpen,
      };

    case "SET_GRAMMAR_OPEN":
      return {
        ...state,
        isGrammarOpen: action.payload,
      };

    case "APPLY_GRAMMAR_FIX": {
      const updatedMarkdown = state.activeMarkdown.replace(
        action.payload.original,
        action.payload.suggestion,
      );
      return {
        ...state,
        activeMarkdown: updatedMarkdown,
        grammarIssues: state.grammarIssues.filter(
          (issue) => issue.id !== action.payload.id,
        ),
        notes: state.notes.map((note) =>
          note.id === state.activeNoteId
            ? { ...note, markdown: updatedMarkdown }
            : note,
        ),
      };
    }

    case "DISMISS_GRAMMAR_ISSUE":
      return {
        ...state,
        grammarIssues: state.grammarIssues.filter(
          (issue) => issue.id !== action.payload,
        ),
      };

    case "CHECK_GRAMMAR":
      return {
        ...state,
        grammarIssues: action.payload,
        isGrammarOpen: true,
      };

    case "UPLOAD_NOTE": {
      const newId = `note-${Date.now()}`;
      const newNote: Note = {
        id: newId,
        title: deriveTitle(action.payload.markdown),
        markdown: action.payload.markdown,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      return {
        ...state,
        activeNoteId: newId,
        activeTitle: newNote.title,
        activeMarkdown: newNote.markdown,
        notes: [newNote, ...state.notes],
      };
    }

    default:
      return state;
  }
}

export interface NotesContextValue {
  state: NoteState;
  dispatch: React.Dispatch<NoteAction>;
  // Helper functions
  createNote: () => void;
  removeNote: (id: string) => void;
  selectNote: (note: Note) => void;
  setActiveTitle: (title: string) => void;
  setActiveMarkdown: (markdown: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: "split" | "editor" | "preview") => void;
  toggleGrammar: () => void;
  checkGrammar: (issues: GrammarIssue[]) => void;
  setIsGrammarOpen: (isOpen: boolean) => void;
  applyGrammarFix: (issue: GrammarIssue) => Promise<void> | void;
  dismissGrammarIssue: (id: string) => void;
  uploadNote: (markdown: string) => void;
  saveNote: (id?: string, title?: string, markdown?: string) => Promise<Note | undefined>;
}

export const NoteContext = createContext<NotesContextValue | null>(null);

export default function NotesContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(notesReducer, INITIAL_STATE);

  useEffect(() => {
    fetch("/notes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch notes");
        return res.json();
      })
      .then((data: Note[]) => {
        dispatch({ type: "SET_NOTES", payload: data });
      })
      .catch((err) => {
        console.error("Fetch /notes error:", err);
      });
  }, []);

  const deleteNote = async (id: string) => {
    const res = await fetch(`/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error("Delete note failed.");
    }
  };

  const saveNote = async (
    id?: string,
    title?: string,
    markdown?: string,
  ): Promise<Note | undefined> => {
    const targetId = id ?? state.activeNoteId;
    const targetTitle = title ?? state.activeTitle;
    const targetMarkdown = markdown ?? state.activeMarkdown;

    const res = await fetch("/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: targetId,
        title: targetTitle,
        markdown: targetMarkdown,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to save note");
    }

    return await res.json();
  };

  const createNote = () => dispatch({ type: "CREATE_NOTE" });
  const removeNote = useCallback(async (id: string) => {
    await deleteNote(id);
    dispatch({ type: "REMOVE_NOTE", payload: id });
  }, []);
  const selectNote = (note: Note) =>
    dispatch({ type: "SELECT_NOTE", payload: note });
  const setActiveTitle = (title: string) =>
    dispatch({ type: "SET_ACTIVE_TITLE", payload: title });
  const setActiveMarkdown = (markdown: string) =>
    dispatch({ type: "SET_ACTIVE_MARKDOWN", payload: markdown });
  const setSearchQuery = (query: string) =>
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  const setViewMode = (mode: "split" | "editor" | "preview") =>
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  const toggleGrammar = () => dispatch({ type: "TOGGLE_GRAMMAR" });
  const setIsGrammarOpen = (isOpen: boolean) =>
    dispatch({ type: "SET_GRAMMAR_OPEN", payload: isOpen });
  const applyGrammarFix = async (issue: GrammarIssue) => {
    const updatedMarkdown = state.activeMarkdown.replace(
      issue.original,
      issue.suggestion,
    );
    dispatch({ type: "APPLY_GRAMMAR_FIX", payload: issue });

    if (state.activeNoteId) {
      try {
        await saveNote(state.activeNoteId, state.activeTitle, updatedMarkdown);
      } catch (err) {
        console.error("Failed to save note after applying grammar fix:", err);
      }
    }
  };
  const dismissGrammarIssue = (id: string) =>
    dispatch({ type: "DISMISS_GRAMMAR_ISSUE", payload: id });
  const checkGrammar = (issues: GrammarIssue[]) =>
    dispatch({ type: "CHECK_GRAMMAR", payload: issues });
  const uploadNote = (markdown: string) =>
    dispatch({ type: "UPLOAD_NOTE", payload: { markdown } });

  return (
    <NoteContext.Provider
      value={{
        state,
        dispatch,
        createNote,
        removeNote,
        selectNote,
        setActiveTitle,
        setActiveMarkdown,
        setSearchQuery,
        setViewMode,
        toggleGrammar,
        setIsGrammarOpen,
        applyGrammarFix,
        dismissGrammarIssue,
        checkGrammar,
        uploadNote,
        saveNote,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesContextProvider");
  }
  return context;
}
