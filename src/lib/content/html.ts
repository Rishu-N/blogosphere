import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { sanitizeSchema } from "./sanitize";

/** Raw admin-provided HTML -> sanitized HTML, using the same allowlist as the Markdown path. */
export async function rawHtmlToSafeHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(html);
  return String(file);
}
