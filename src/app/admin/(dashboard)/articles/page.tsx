import Link from "next/link";
import { articlesStore } from "@/lib/storage/articles-store";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  processing: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

export default async function AdminArticlesPage() {
  const articles = await articlesStore.list();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Articles</h1>
        <Link href="/admin/articles/new" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)]">
          Upload new
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-6 text-[var(--color-text-muted)]">No articles yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Format</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-text)]">{article.title}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{new Date(article.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize text-[var(--color-text-muted)]">{article.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[article.status] ?? ""}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 uppercase text-[var(--color-text-muted)]">{article.format}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/articles/${article.id}`} className="font-medium text-[var(--color-accent-text)] hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
