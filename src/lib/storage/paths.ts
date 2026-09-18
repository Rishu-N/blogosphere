import path from "node:path";
import type { ArticleFormat } from "./types";

const projectRoot = process.cwd();

export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(projectRoot, "data");

export const CONTENT_DIR = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.join(projectRoot, "content");

export const ARTICLES_CONTENT_DIR = path.join(CONTENT_DIR, "articles");

export const ARTICLES_INDEX_PATH = path.join(DATA_DIR, "articles-index.json");
export const COLOR_STATE_PATH = path.join(DATA_DIR, "color-state.json");
export const ACTIVITY_LOG_PATH = path.join(DATA_DIR, "activity-log.jsonl");
export const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
export const SETTINGS_EXAMPLE_PATH = path.join(DATA_DIR, "settings.example.json");
export const HERO_POOL_PATH = path.join(DATA_DIR, "hero-pool.json");

/** Project-root-relative source path for a new article, e.g. "content/articles/<id>.md". */
export function articleSourcePath(id: string, format: ArticleFormat): string {
  const ext = format === "markdown" ? "md" : "html";
  return path.relative(projectRoot, path.join(ARTICLES_CONTENT_DIR, `${id}.${ext}`));
}

/** Resolves a stored project-root-relative path (e.g. an article's sourcePath) to an absolute path. */
export function resolveProjectPath(relativePath: string): string {
  return path.join(projectRoot, relativePath);
}
