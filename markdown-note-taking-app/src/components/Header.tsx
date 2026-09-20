import { useNotes } from "../store/note-context";

const Header = () => {
  const {
    state: { activeMarkdown, activeNoteId, activeTitle },
    createNote,
    uploadNote,
    saveNote,
  } = useNotes();

  return (
    <header className="app-header">
      <div className="brand-section">
        <span className="brand-title">
          NOTE<span className="brand-highlight">.MD</span>
        </span>
      </div>

      <div className="header-actions">
        <button className="neo-btn btn-md btn-green" onClick={createNote}>
          + New Note
        </button>
        <button
          className="neo-btn btn-md btn-yellow"
          onClick={() => saveNote(activeNoteId, activeTitle, activeMarkdown)}
        >
          Save Note
        </button>
        <label className="neo-btn btn-md btn-blue header-upload-btn">
          Upload .md
          <input
            type="file"
            accept=".md,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (!file) {
                return;
              }

              const reader = new FileReader();

              reader.onload = () => {
                const text = reader.result?.toString();
                if (!text) {
                  return;
                }
                uploadNote(text);
              };

              reader.readAsText(file);
            }}
          />
        </label>
      </div>
    </header>
  );
};

export default Header;
