import { remark } from "remark";
import strip from "strip-markdown";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { toString as hastToString } from "hast-util-to-string";
import type { ArticleFormat } from "../storage/types";

async function markdownToPlainText(markdown: string): Promise<string> {
  const file = await remark().use(strip).process(markdown);
  return String(file).replace(/\s+/g, " ").trim();
}

function htmlToPlainText(html: string): string {
  const tree = unified().use(rehypeParse, { fragment: true }).parse(html);
  return hastToString(tree).replace(/\s+/g, " ").trim();
}

/** Raw Markdown or HTML -> plain text, for spellcheck and AI classification input. */
export async function extractPlainText(format: ArticleFormat, rawContent: string): Promise<string> {
  return format === "markdown" ? markdownToPlainText(rawContent) : htmlToPlainText(rawContent);
}
