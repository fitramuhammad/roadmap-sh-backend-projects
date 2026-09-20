export interface Note {
  id: string;
  title: string;
  markdown: string;
  createdAt: string;
}

export interface GrammarIssue {
  id: string;
  type: string;
  message: string;
  original: string;
  suggestion: string;
}


