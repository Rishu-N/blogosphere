import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dictionary-en loads its .aff/.dic data files via
  // fs.readFile(new URL(..., import.meta.url)) at import time. Bundling it
  // through Turbopack breaks that (the bundled module's `new URL(...)`
  // isn't recognized as a real URL instance by Node's fs internals when
  // it crosses the bundle boundary -- "TypeError: The 'path' argument
  // must be of type string or an instance of Buffer or URL. Received an
  // instance of URL"). Marking it external makes Next.js load it via
  // native Node `import` instead, where this works correctly. See
  // /context.md.
  serverExternalPackages: ["dictionary-en"],
};

export default nextConfig;
