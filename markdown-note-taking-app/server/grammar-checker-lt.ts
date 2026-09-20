import type { GrammarIssue } from "./types";
import type { GrammarChecker } from "./grammar-checker";

interface LanguageToolSuggestion {
  value: string;
}

interface LanguageToolMatch {
  rule: { id: string; issueType?: string };
  message: string;
  context: { text: string; offset: number; length: number };
  replacements?: LanguageToolSuggestion[];
}

interface LanguageToolResponse {
  matches?: LanguageToolMatch[];
}

export class LanguageToolChecker implements GrammarChecker {
  constructor(
    private readonly baseUrl = "https://api.languagetool.com",
    private readonly language = "en-US",
  ) {}

  async check(text: string): Promise<GrammarIssue[]> {
    const body = new URLSearchParams({ text, language: this.language });

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/v2/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      return [];
    }

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as LanguageToolResponse;

    if (!Array.isArray(data.matches)) {
      return [];
    }

    return data.matches.map((m, i) => ({
      id: `${m.rule.id}-${i}`,
      type: m.rule.issueType ?? 'UNKNOWN',
      message: m.message,
      original: m.context.text.slice(m.context.offset, m.context.offset + m.context.length),
      suggestion: m.replacements?.[0]?.value ?? '',
    }));
  }
}
