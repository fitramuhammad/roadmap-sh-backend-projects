import { useNotes } from "../store/note-context";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import GrammarDrawer from "./GrammarDrawer";
import Editor from "./Editor";

const NoteTakingApp = () => {
  const {
    state: { isGrammarOpen },
  } = useNotes();

  return (
    <div className="app-container">
      <Header />
      {/* Main Workspace */}
      <div className="app-workspace">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content Pane */}
        <Editor />
        {/* Grammar Check Drawer */}
        {isGrammarOpen && <GrammarDrawer />}
      </div>
      {/* Footer Status Bar */}
      <Footer />
    </div>
  );
};

export default NoteTakingApp;
