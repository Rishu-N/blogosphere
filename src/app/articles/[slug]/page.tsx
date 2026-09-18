import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articlesStore } from "@/lib/storage/articles-store";
import { activityLogStore } from "@/lib/storage/activity-log-store";
import { colorStateStore } from "@/lib/storage/color-state-store";
import { computeCurrentTheme } from "@/lib/color-engine/engine";
import { renderArticleContent } from "@/lib/content/render";

// Load-bearing, same reason as the other dynamic routes: this page mutates
// color-engine state and must render its per-article theme fresh every
// visit. See /context.md.
export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await articlesStore.getBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: stripHtml(article.excerpt).slice(0, 160),
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await articlesStore.getBySlug(slug);
  if (!article || article.status !== "published") notFound();

  const [raw, theme] = await Promise.all([articlesStore.getRawContent(article), computeCurrentTheme({ category: article.category })]);

  const [html] = await Promise.all([
    renderArticleContent(article.format, raw),
    activityLogStore.append({
      articleId: article.id,
      category: article.category,
      event: "article_view",
      timestamp: new Date().toISOString(),
    }),
    colorStateStore.recordEvent(article.category),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm font-medium text-[var(--color-text-muted)] hover:underline">
        &larr; Back home
      </Link>

      <article
        style={theme.cssVars as CSSProperties}
        className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-10"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </time>
          <span aria-hidden="true">&middot;</span>
          <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 font-medium capitalize text-[var(--color-accent)]">
            {article.category}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>{article.readingTimeMinutes} min read</span>
        </div>

        <h1 className="mt-3 text-3xl font-bold text-[var(--color-text)] sm:text-4xl">{article.title}</h1>

        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs text-[var(--color-text-muted)]">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose mt-8 max-w-none text-[var(--color-text)] prose-headings:text-[var(--color-text)] prose-a:text-[var(--color-accent)]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
