import Link from "next/link";
import { articlesStore } from "@/lib/storage/articles-store";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const articles = await articlesStore.list();
  const published = articles.filter((a) => a.status === "published").length;
  const processing = articles.filter((a) => a.status === "processing").length;
  const failed = articles.filter((a) => a.status === "failed").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Published" value={published} />
        <StatCard label="Processing" value={processing} />
        <StatCard label="Failed" value={failed} />
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/admin/articles/new"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-text-on-accent)]"
        >
          Upload a new article
        </Link>
        <Link
          href="/admin/articles"
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 font-medium text-[var(--color-text)]"
        >
          Manage articles
        </Link>
        <Link href="/admin/stats" className="rounded-lg border border-[var(--color-border)] px-4 py-2 font-medium text-[var(--color-text)]">
          View stats
        </Link>
      </div>
    </div>
  );
}
