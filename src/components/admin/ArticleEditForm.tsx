"use client";

import { updateArticleMeta } from "@/lib/actions/articles";
import type { ArticleMeta } from "@/lib/storage/types";

export default function ArticleEditForm({ article }: { article: ArticleMeta }) {
  const action = updateArticleMeta.bind(null, article.id);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-muted)]">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={article.title}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-[var(--color-text-muted)]">
            Published date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            defaultValue={article.date.slice(0, 10)}
            className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-muted)]">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={article.category}
            className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
      </div>
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-[var(--color-text-muted)]">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          name="tags"
          defaultValue={article.tags.join(", ")}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
        />
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Saving here marks this article &ldquo;manually classified&rdquo; -- automatic re-classification won&apos;t overwrite it
        afterward unless you explicitly re-run it below.
      </p>
      <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)]">
        Save changes
      </button>
    </form>
  );
}
