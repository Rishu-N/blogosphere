import { computeStatsSummary } from "@/lib/stats/aggregate";
import { TopArticlesChart, CategoryPopularityChart, HueHistoryStrip } from "@/components/admin/StatsCharts";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const stats = await computeStatsSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Stats</h1>
        <a
          href="/api/admin/stats/export"
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
        >
          Export activity log (CSV)
        </a>
      </div>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Overview</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{stats.totalEvents} total preview/view events recorded.</p>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Most-previewed articles</h2>
        <div className="mt-4">
          <TopArticlesChart articles={stats.topArticles} />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Category popularity</h2>
        <div className="mt-4">
          <CategoryPopularityChart categories={stats.categoryPopularity} />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Color drift over time</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          The site&apos;s long-term drift hue, reconstructed from the activity log — hover a swatch for its timestamp.
        </p>
        <div className="mt-4">
          <HueHistoryStrip points={stats.hueHistory} />
        </div>
      </section>
    </div>
  );
}
