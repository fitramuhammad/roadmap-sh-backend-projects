import createDOMPurify, { type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as unknown as WindowLike);

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}