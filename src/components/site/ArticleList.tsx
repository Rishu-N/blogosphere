import ArticleCard from "./ArticleCard";
import type { ArticleMeta } from "@/lib/storage/types";

export default function ArticleList({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) {
    return <p className="text-[var(--color-text-muted)]">No articles published yet. Check back soon.</p>;
  }
  return (
    <div className="space-y-5">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
