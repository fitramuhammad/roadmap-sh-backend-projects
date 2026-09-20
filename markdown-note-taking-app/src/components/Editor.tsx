import { useMemo, useState } from "react";
import { marked } from "marked";
import { useNotes } from "../store/note-context";
import type { GrammarIssue } from "../../server/types";
import { sanitizeHtml } from "../libs/sanitize";

const Editor = () => {
  const {
    state: { activeTitle, viewMode, activeMarkdown, activeNoteId },
    setActiveMarkdown,
    setIsGrammarOpen,
    checkGrammar,
  } = useNotes();
  const [isChecking, setIsChecking] = useState(false);

  // Render HTML preview using marked
  const renderedHtml = useMemo(() => {
    try {
      return sanitizeHtml(marked.parse(activeMarkdown, { async: false }) as string);
    } catch {
      return "<p>Error parsing markdown</p>";
    }
  }, [activeMarkdown]);

  const handleCheckGrammar = async () => {
    if (!activeNoteId) return;
    setIsChecking(true);
    try {
      const res = await fetch(`/notes/${activeNoteId}/grammar`);

      if (!res.ok) {
        return;
      }

      const grammar: GrammarIssue[] = await res.json();
      checkGrammar(grammar);
      setIsGrammarOpen(true);
    } catch (err) {
      console.error("Failed to check grammar:", err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className="app-main">
      {/* Editor Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-title-group">
          {activeTitle && <div className="neo-box">{activeTitle}</div>}
        </div>

        <div className="toolbar-controls">
          <button
            className="neo-btn btn-md btn-pink"
            onClick={handleCheckGrammar}
            disabled={isChecking || !activeNoteId}
          >
            {isChecking ? "Checking..." : "Check Grammar"}
          </button>
        </div>
      </div>

      {/* Split Panes */}
      <div className="split-pane-container">
        {(viewMode === "split" || viewMode === "editor") && (
          <div className="pane-editor">
            <div className="pane-header">
              <span>Markdown Editor</span>
            </div>
            <textarea
              className="editor-textarea"
              value={activeMarkdown}
              onChange={(e) => setActiveMarkdown(e.target.value)}
              placeholder="Type markdown content here..."
              spellCheck={false}
            />
          </div>
        )}

        {(viewMode === "split" || viewMode === "preview") && (
          <div className="pane-preview">
            <div className="pane-header">
              <span>HTML Preview</span>
            </div>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default Editor;
