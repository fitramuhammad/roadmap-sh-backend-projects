import { useNotes } from "../store/note-context";

const GrammarDrawer = () => {
  const {
    state: { grammarIssues },
    setIsGrammarOpen,
    applyGrammarFix,
    dismissGrammarIssue,
  } = useNotes();
  return (
    <aside className="grammar-drawer">
      <div className="grammar-header">
        <span className="grammar-title">Grammar Inspector</span>
        <button
          className="neo-btn btn-sm grammar-close-btn"
          onClick={() => setIsGrammarOpen(false)}
        >
          ✕
        </button>
      </div>

      <div className="grammar-body">
        {grammarIssues.length === 0 ? (
          <div className="grammar-empty">
            No grammar issues detected!
          </div>
        ) : (
          grammarIssues.map((issue) => (
            <div key={issue.id} className="issue-card">
              <div className="issue-card-header">
                <span className="neo-badge issue-type">{issue.type}</span>
                <button
                  className="neo-btn btn-sm btn-pink issue-dismiss-btn"
                  onClick={() => dismissGrammarIssue(issue.id)}
                  title="Dismiss issue"
                >
                  ✕
                </button>
              </div>

              <div className="issue-message">{issue.message}</div>

              {issue.original && (
                <div className="issue-original">
                  Original:{" "}
                  <mark className="issue-original-mark">
                    {issue.original}
                  </mark>
                </div>
              )}

              {issue.suggestion && (
                <div className="issue-suggestions">
                  <div className="suggestion-item">
                    <span className="suggestion-text">{issue.suggestion}</span>
                    <button
                      className="neo-btn btn-sm btn-green"
                      onClick={() => applyGrammarFix(issue)}
                    >
                      Apply Fix
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default GrammarDrawer;
