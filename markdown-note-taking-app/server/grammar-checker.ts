import type { GrammarIssue } from "./types";

export interface GrammarChecker {
  check(text: string): Promise<GrammarIssue[]>;
}
