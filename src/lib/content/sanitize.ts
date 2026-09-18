import { defaultSchema } from "hast-util-sanitize";
import deepmerge from "deepmerge";

// Conservative allowlist on top of rehype-sanitize's defaultSchema: no
// <iframe>, no inline event handlers, no embeds. Applied identically to
// both the Markdown-rendered path and the raw-HTML path, even though only
// the trusted admin uploads content -- cheap insurance, and it keeps
// widening this (e.g. for embeds) a deliberate, reviewed change instead of
// an accidental one.
export const sanitizeSchema = deepmerge(defaultSchema, {
  tagNames: ["figure", "figcaption"],
  attributes: {
    "*": ["className"],
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "title", "target", "rel"],
  },
});
