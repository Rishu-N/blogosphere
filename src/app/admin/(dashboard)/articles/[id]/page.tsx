import { notFound } from "next/navigation";
import { articlesStore } from "@/lib/storage/articles-store";
import ArticleEditForm from "@/components/admin/ArticleEditForm";
import ArticleActions from "@/components/admin/ArticleActions";

export const dynamic = "force-dynamic";

interface AdminArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminArticleDetailPage({ params }: AdminArticleDetailPageProps) {
  const { id } = await params;
  const article = await articlesStore.getById(id);
  if (!article) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">{article.title}</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Status: <span className="font-medium">{article.status}</span>
        {article.classification && (
          <>
            {" · "}Classified via {article.classification.method}
            {typeof article.classification.confidence === "number" &&
              ` (${Math.round(article.classification.confidence * 100)}% confidence)`}
          </>
        )}
      </p>

      <div className="mt-6">
        <ArticleEditForm article={article} />
      </div>

      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <ArticleActions articleId={article.id} status={article.status} />
      </div>
    </div>
  );
}
