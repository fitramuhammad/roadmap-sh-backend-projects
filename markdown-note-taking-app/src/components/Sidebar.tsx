import { useNotes } from "../store/note-context";

const Sidebar = () => {
  const {
    state: { searchQuery, notes, activeNoteId },
    setSearchQuery,
    selectNote,
    removeNote,
  } = useNotes();

  // Filter notes by search
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.markdown.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-stats">
          <span className="sidebar-explorer-label">
            Explorer
          </span>
          <span className="neo-badge">{filteredNotes.length} notes</span>
        </div>
        <input
          type="text"
          className="neo-input"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="notes-list">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`note-item ${note.id === activeNoteId ? "active" : ""}`}
            onClick={() => selectNote(note)}
          >
            <div className="note-item-header">
              <span className="note-item-title">{note.title}</span>
              {activeNoteId == note.id && (
                // remove button
                <button
                  className="neo-btn btn-sm btn-pink"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(activeNoteId);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="note-item-preview">
              {(note.markdown ?? "").replace(/[#*`>]/g, "").slice(0, 90)}
            </div>
            <div className="note-item-footer">
              <span>{note.createdAt}</span>
              <span className="neo-badge neo-badge-sm">
                MD
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
