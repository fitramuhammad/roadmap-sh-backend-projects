export function deriveTitle(markdown: string): string {
  const lines = markdown.split("\n");
  const firstNonEmpty = lines.find((l) => l.trim().length > 0) ?? "";
  const headingMatch = firstNonEmpty.match(/^#+\s*(.*)$/);
  const title = (headingMatch ? headingMatch[1] : firstNonEmpty).trim();
  return title || "Untitled";
}