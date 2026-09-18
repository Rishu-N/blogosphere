"use client";

import { useTransition } from "react";
import { reclassifyArticle, retryClassification, deleteArticle } from "@/lib/actions/articles";
import type { ArticleStatus } from "@/lib/storage/types";

export default function ArticleActions({ articleId, status }: { articleId: string; status: ArticleStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    startTransition(async () => {
      await retryClassification(articleId);
    });
  }

  function handleReclassify() {
    startTransition(async () => {
      await reclassifyArticle(articleId);
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteArticle(articleId);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === "failed" && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
        >
          Retry classification
        </button>
      )}
      <button
        type="button"
        onClick={handleReclassify}
        disabled={isPending}
        className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
      >
        Re-run classification
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
      >
        Delete article
      </button>
    </div>
  );
}
