import Link from "next/link";
import PreviewTrigger from "./PreviewTrigger";
import type { ArticleMeta } from "@/lib/storage/types";

export default function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <time dateTime={article.date}>
          {new Date(article.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </time>
        <span aria-hidden="true">&middot;</span>
        <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 font-medium capitalize text-[var(--color-accent)]">
          {article.category}
        </span>
        <span aria-hidden="true">&middot;</span>
        <span>{article.readingTimeMinutes} min read</span>
      </div>

      <h3 className="mt-2 text-lg font-semibold text-[var(--color-text)]">
        <Link href={`/articles/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h3>

      {article.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span key={tag} className="text-xs text-[var(--color-text-muted)]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm font-medium">
        <PreviewTrigger articleId={article.id} className="text-[var(--color-accent)] hover:underline">
          Preview
        </PreviewTrigger>
        <Link href={`/articles/${article.slug}`} className="text-[var(--color-text-muted)] hover:underline">
          Read full article
        </Link>
      </div>
    </article>
  );
}
