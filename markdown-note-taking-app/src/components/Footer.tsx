import { useNotes } from "../store/note-context";

const Footer = () => {
  const {
    state: { activeMarkdown, activeNoteId },
  } = useNotes();
  const wordCount = activeMarkdown.trim()
    ? activeMarkdown.trim().split(/\s+/).length
    : 0;
  const charCount = activeMarkdown.length;
  return (
    <footer className="app-statusbar">
      <div className="statusbar-item">
        <span>Words: {wordCount}</span>
        <span>Characters: {charCount}</span>
        <span>ID: {activeNoteId}</span>
      </div>
    </footer>
  );
};

export default Footer;
