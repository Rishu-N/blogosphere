import { promises as fs } from "node:fs";
import path from "node:path";
import { ARTICLES_INDEX_PATH, resolveProjectPath } from "./paths";
import { readValidatedJsonFile, updateJsonFile } from "./json-file-store";
import { ArticlesIndexSchema } from "../validation/schemas";
import type { ArticlesIndex, ArticlesStore } from "./types";

const EMPTY_INDEX: ArticlesIndex = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  articles: [],
};

const LABEL = "articles-index.json";

async function readIndex(): Promise<ArticlesIndex> {
  return readValidatedJsonFile(ARTICLES_INDEX_PATH, ArticlesIndexSchema, EMPTY_INDEX, LABEL);
}

export const articlesStore: ArticlesStore = {
  async list() {
    const index = await readIndex();
    return [...index.articles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  },

  async getById(id) {
    const index = await readIndex();
    return index.articles.find((a) => a.id === id);
  },

  async getBySlug(slug) {
    const index = await readIndex();
    return index.articles.find((a) => a.slug === slug);
  },

  async create(meta, rawContent) {
    const filePath = resolveProjectPath(meta.sourcePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, rawContent, "utf8");
    await updateJsonFile(
      ARTICLES_INDEX_PATH,
      ArticlesIndexSchema,
      EMPTY_INDEX,
      (current) => {
        current.articles.push(meta);
        current.updatedAt = new Date().toISOString();
        return current;
      },
      LABEL
    );
    return meta;
  },

  async update(id, mutator) {
    const updated = await updateJsonFile(
      ARTICLES_INDEX_PATH,
      ArticlesIndexSchema,
      EMPTY_INDEX,
      (current) => {
        const idx = current.articles.findIndex((a) => a.id === id);
        if (idx === -1) throw new Error(`Article not found: ${id}`);
        current.articles[idx] = mutator({ ...current.articles[idx] });
        current.updatedAt = new Date().toISOString();
        return current;
      },
      LABEL
    );
    const found = updated.articles.find((a) => a.id === id);
    if (!found) throw new Error(`Article not found after update: ${id}`);
    return found;
  },

  async getRawContent(article) {
    return fs.readFile(resolveProjectPath(article.sourcePath), "utf8");
  },

  async delete(id) {
    const index = await readIndex();
    const article = index.articles.find((a) => a.id === id);
    if (!article) return;
    await updateJsonFile(
      ARTICLES_INDEX_PATH,
      ArticlesIndexSchema,
      EMPTY_INDEX,
      (current) => {
        current.articles = current.articles.filter((a) => a.id !== id);
        current.updatedAt = new Date().toISOString();
        return current;
      },
      LABEL
    );
    await fs.unlink(resolveProjectPath(article.sourcePath)).catch(() => {});
  },
};
