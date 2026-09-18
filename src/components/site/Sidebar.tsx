import PreviewTrigger from "./PreviewTrigger";
import type { ArticleMeta } from "@/lib/storage/types";

export default function Sidebar({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;
  return (
    <aside className="h-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Worth a look</h2>
      <ul className="mt-4 space-y-4">
        {articles.map((article) => (
          <li key={article.id}>
            <p className="text-xs font-medium capitalize text-[var(--color-accent-text)]">{article.category}</p>
            <PreviewTrigger articleId={article.id} className="text-left font-medium text-[var(--color-text)] hover:underline">
              {article.title}
            </PreviewTrigger>
          </li>
        ))}
      </ul>
    </aside>
  );
}
