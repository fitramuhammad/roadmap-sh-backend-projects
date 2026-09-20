import NotesContextProvider from "./store/note-context";
import NoteTakingApp from "./components/NoteTakingApp";

export function App() {
  return (
    <NotesContextProvider>
      <NoteTakingApp />
    </NotesContextProvider>
  );
}
