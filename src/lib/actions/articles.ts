"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ulid } from "ulid";
import { articlesStore } from "@/lib/storage/articles-store";
import { articleSourcePath } from "@/lib/storage/paths";
import { renderArticleContent } from "@/lib/content/render";
import { extractExcerpt } from "@/lib/content/excerpt";
import { extractPlainText } from "@/lib/content/plain-text";
import { checkSpellingPlainText, type SpellcheckIssue } from "@/lib/spellcheck/check";
import { classifyArticle } from "@/lib/ai/classifier";
import type { ArticleFormat, ArticleMeta } from "@/lib/storage/types";

export type { SpellcheckIssue };

const MAX_CLASSIFY_ATTEMPTS = 3;

export async function checkArticleSpelling(rawContent: string, format: ArticleFormat): Promise<SpellcheckIssue[]> {
  const plainText = await extractPlainText(format, rawContent);
  return checkSpellingPlainText(plainText);
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "article";
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (await articlesStore.getBySlug(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

/**
 * Runs classification in the background and finalizes the article's
 * status. Never awaited by its caller on the request path -- see
 * createArticle() below and /context.md for why that's safe on a
 * persistent Node process.
 */
async function classifyAndFinalize(articleId: string, attempt = 1): Promise<void> {
  try {
    const article = await articlesStore.getById(articleId);
    if (!article) return;
    const raw = await articlesStore.getRawContent(article);
    const plainText = await extractPlainText(article.format, raw);
    const result = await classifyArticle(plainText);
    await articlesStore.update(articleId, (a) => ({
      ...a,
      category: result.category,
      tags: result.tags,
      classification: {
        method: result.method,
        confidence: result.confidence,
        classifiedAt: new Date().toISOString(),
        attempts: attempt,
        error: result.error,
      },
      status: "published",
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`[classify] failed for ${articleId} (attempt ${attempt}):`, err);
    await articlesStore
      .update(articleId, (a) => ({
        ...a,
        status: attempt >= MAX_CLASSIFY_ATTEMPTS ? "failed" : "processing",
        classification: { method: "heuristic", attempts: attempt, error: String(err) },
        updatedAt: new Date().toISOString(),
      }))
      .catch(() => {});
  }
}

/** Exposed so the boot-time sweep (instrumentation.ts) and a manual "retry" button can both re-drive a stuck article. */
export async function retryClassification(articleId: string): Promise<void> {
  const article = await articlesStore.getById(articleId);
  if (!article) return;
  const attempt = (article.classification?.attempts ?? 0) + 1;
  await classifyAndFinalize(articleId, attempt);
}

export async function reclassifyArticle(articleId: string): Promise<void> {
  await articlesStore.update(articleId, (a) => ({ ...a, status: "processing", updatedAt: new Date().toISOString() }));
  await classifyAndFinalize(articleId, 1);
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/");
}

export async function createArticle(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const dateInput = String(formData.get("date") ?? "").trim();
  const format = (String(formData.get("format") ?? "markdown") === "html" ? "html" : "markdown") as ArticleFormat;
  const content = String(formData.get("content") ?? "");

  if (!title || !content.trim()) {
    throw new Error("Title and content are required.");
  }

  const id = ulid();
  const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();
  const slug = await uniqueSlug(slugify(title));
  const sourcePath = articleSourcePath(id, format);

  const safeHtml = await renderArticleContent(format, content);
  const { excerptHtml, excerptIsFull, wordCount, readingTimeMinutes } = extractExcerpt(safeHtml);
  const now = new Date().toISOString();

  const meta: ArticleMeta = {
    id,
    slug,
    title,
    date,
    createdAt: now,
    updatedAt: now,
    category: "uncategorized",
    tags: [],
    format,
    sourcePath,
    excerpt: excerptHtml,
    excerptIsFull,
    status: "processing",
    wordCount,
    readingTimeMinutes,
  };

  await articlesStore.create(meta, content);

  // Fire-and-forget: the admin doesn't wait on classification to get a
  // response. See /context.md for the persistent-process assumption this
  // relies on.
  void classifyAndFinalize(id);

  revalidatePath("/admin/articles");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function updateArticleMeta(articleId: string, formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const dateInput = String(formData.get("date") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const tagsInput = String(formData.get("tags") ?? "");
  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  await articlesStore.update(articleId, (a) => ({
    ...a,
    title: title || a.title,
    date: dateInput ? new Date(dateInput).toISOString() : a.date,
    category: category || a.category,
    tags,
    classification: { method: "manual", classifiedAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  }));

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/");
}

export async function deleteArticle(articleId: string): Promise<void> {
  await articlesStore.delete(articleId);
  revalidatePath("/admin/articles");
  revalidatePath("/");
  redirect("/admin/articles");
}
