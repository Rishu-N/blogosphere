import Link from "next/link";
import type { ArticleStat, CategoryStat, HuePoint } from "@/lib/stats/aggregate";

function BarRow({
  label,
  count,
  max,
  fillColor,
  href,
}: {
  label: string;
  count: number;
  max: number;
  fillColor: string;
  href?: string;
}) {
  const widthPct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  const row = (
    <div className="flex items-center gap-3 py-1">
      <div className="w-36 shrink-0 truncate text-sm capitalize text-[var(--color-text)]" title={label}>
        {label}
      </div>
      <div className="h-2.5 flex-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${widthPct}%`, backgroundColor: fillColor }}
          title={`${label}: ${count}`}
        />
      </div>
      <div className="w-8 shrink-0 text-right text-xs text-[var(--color-text-muted)]">{count}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80">
      {row}
    </Link>
  ) : (
    row
  );
}

export function TopArticlesChart({ articles }: { articles: ArticleStat[] }) {
  if (articles.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No preview or view activity yet.</p>;
  }
  const max = Math.max(...articles.map((a) => a.count));
  return (
    <div>
      {articles.map((article) => (
        <BarRow
          key={article.articleId}
          label={article.title}
          count={article.count}
          max={max}
          fillColor="var(--color-accent)"
          href={article.slug ? `/articles/${article.slug}` : undefined}
        />
      ))}
    </div>
  );
}

export function CategoryPopularityChart({ categories }: { categories: CategoryStat[] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No activity yet.</p>;
  }
  const max = Math.max(...categories.map((c) => c.count));
  return (
    <div>
      {categories.map((category) => (
        <BarRow
          key={category.category}
          label={category.category}
          count={category.count}
          max={max}
          fillColor={`hsl(${category.hue} 55% 50%)`}
        />
      ))}
    </div>
  );
}

export function HueHistoryStrip({ points }: { points: HuePoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">Not enough activity yet to show drift history.</p>;
  }
  return (
    <div>
      <div className="flex h-8 gap-[2px] overflow-hidden rounded-lg" role="img" aria-label="Color drift history, oldest to newest">
        {points.map((point, index) => (
          <div
            key={`${point.timestamp}-${index}`}
            className="flex-1"
            style={{ backgroundColor: `hsl(${point.hue.toFixed(1)} 45% 55%)` }}
            title={`${new Date(point.timestamp).toLocaleString()} — hue ${Math.round(point.hue)}°`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{new Date(points[0].timestamp).toLocaleDateString()}</span>
        <span>{new Date(points[points.length - 1].timestamp).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
