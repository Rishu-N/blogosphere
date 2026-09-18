import type { ArticleFormat } from "../storage/types";
import { markdownToSafeHtml } from "./markdown";
import { rawHtmlToSafeHtml } from "./html";

/** Renders raw article source (Markdown or HTML) to sanitized HTML ready to render. */
export async function renderArticleContent(format: ArticleFormat, rawContent: string): Promise<string> {
  return format === "markdown" ? markdownToSafeHtml(rawContent) : rawHtmlToSafeHtml(rawContent);
}
