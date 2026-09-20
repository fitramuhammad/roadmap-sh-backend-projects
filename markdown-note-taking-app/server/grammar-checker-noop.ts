import type { GrammarIssue } from './types';
import type { GrammarChecker } from './grammar-checker';

export class NoopGrammarChecker implements GrammarChecker {
  async check(_text: string): Promise<GrammarIssue[]> {
    return [];
  }
}
