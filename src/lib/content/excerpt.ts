import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { toString as hastToString } from "hast-util-to-string";
import type { Root, RootContent, Element } from "hast";

export interface ExcerptResult {
  excerptHtml: string;
  /** True if excerptHtml already contains the entire article (no "read more" needed). */
  excerptIsFull: boolean;
  wordCount: number;
  readingTimeMinutes: number;
}

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
// "if it is small then the entire article" -- a short piece shows in full
// even if it happens to contain 2+ headings.
const SHORT_ARTICLE_WORD_THRESHOLD = 120;

function isElement(node: RootContent): node is Element {
  return node.type === "element";
}

/**
 * Given already-sanitized article HTML, extracts the "first section" --
 * everything up to (not including) the second top-level heading -- or the
 * whole article if it's short or has fewer than two headings. Only
 * *top-level* headings count as section breaks; a heading nested inside a
 * blockquote or similar shouldn't split the excerpt.
 */
export function extractExcerpt(safeHtml: string): ExcerptResult {
  const tree = unified().use(rehypeParse, { fragment: true }).parse(safeHtml) as Root;
  const fullText = hastToString(tree);
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  const children = tree.children;
  let headingsSeen = 0;
  let cutIndex = children.length;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (isElement(node) && HEADING_TAGS.has(node.tagName)) {
      headingsSeen += 1;
      if (headingsSeen === 2) {
        cutIndex = i;
        break;
      }
    }
  }

  const hasSecondHeading = cutIndex < children.length;
  const excerptIsFull = !hasSecondHeading || wordCount <= SHORT_ARTICLE_WORD_THRESHOLD;
  const nodesToRender = excerptIsFull ? children : children.slice(0, cutIndex);
  const renderTree: Root = { type: "root", children: nodesToRender };
  const excerptHtml = unified().use(rehypeStringify).stringify(renderTree);

  return { excerptHtml, excerptIsFull, wordCount, readingTimeMinutes };
}
