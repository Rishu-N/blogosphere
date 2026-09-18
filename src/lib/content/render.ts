import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import type { Root } from "hast";
import type { ArticleFormat } from "../storage/types";
import { markdownToSafeHtml } from "./markdown";
import { rawHtmlToSafeHtml } from "./html";

/**
 * Drops a single LEADING <h1> if the content opens with one. The article
 * page and preview modal already render the article's title (from
 * ArticleMeta) prominently on their own -- content that also opens with
 * "# Title" (a very natural thing to type in Markdown) would otherwise
 * show the title twice. Any other heading, anywhere else, is left alone.
 */
function stripLeadingH1(html: string): string {
  const tree = unified().use(rehypeParse, { fragment: true }).parse(html) as Root;
  const [first, ...rest] = tree.children;
  if (first?.type === "element" && first.tagName === "h1") {
    return unified().use(rehypeStringify).stringify({ type: "root", children: rest } as Root);
  }
  return html;
}

/** Renders raw article source (Markdown or HTML) to sanitized HTML ready to display. */
export async function renderArticleContent(format: ArticleFormat, rawContent: string): Promise<string> {
  const html = format === "markdown" ? await markdownToSafeHtml(rawContent) : await rawHtmlToSafeHtml(rawContent);
  return stripLeadingH1(html);
}
