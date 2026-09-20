import { markdown } from "bun";

export interface MarkdownRenderer {
  render(markdown: string): string;
}

export class MarkedRenderer implements MarkdownRenderer {
  render(markdownText: string): string {
    return markdown.html(markdownText);
  }
}
