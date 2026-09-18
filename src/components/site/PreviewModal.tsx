"use client";

import Link from "next/link";
import { usePreview } from "./PreviewContext";

export default function PreviewModal() {
  const { isOpen, isLoading, error, article, closePreview } = usePreview();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 sm:py-16"
      onClick={closePreview}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={article ? article.title : "Article preview"}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Preview</span>
          <button
            type="button"
            onClick={closePreview}
            className="rounded-full px-2 py-1 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-accent-soft)]"
            aria-label="Close preview"
          >
            Close
          </button>
        </div>

        {isLoading && <p className="mt-6 text-[var(--color-text-muted)]">Loading preview…</p>}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        {article && !isLoading && !error && (
          <>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">{article.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <time dateTime={article.date}>
                {new Date(article.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </time>
              <span aria-hidden="true">&middot;</span>
              <span className="capitalize">{article.category}</span>
              <span aria-hidden="true">&middot;</span>
              <span>{article.readingTimeMinutes} min read</span>
            </div>

            <div
              className="prose prose-sm mt-6 max-w-none text-[var(--color-text)] prose-headings:text-[var(--color-text)] prose-a:text-[var(--color-accent-text)]"
              dangerouslySetInnerHTML={{ __html: article.excerpt }}
            />

            {article.excerptIsFull ? (
              <p className="mt-6 text-sm text-[var(--color-text-muted)]">That&apos;s the whole article.</p>
            ) : (
              <Link
                href={`/articles/${article.slug}`}
                className="mt-6 inline-flex items-center gap-1 font-medium text-[var(--color-accent-text)] hover:underline"
              >
                Read the full article &rarr;
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
