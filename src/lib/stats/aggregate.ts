import { activityLogStore } from "../storage/activity-log-store";
import { articlesStore } from "../storage/articles-store";
import { colorStateStore } from "../storage/color-state-store";
import { computeDrift } from "../color-engine/engine";
import { hueForCategory } from "../color-engine/palette";
import type { ActivityEvent, ColorTuning } from "../storage/types";

export interface ArticleStat {
  articleId: string;
  title: string;
  slug: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  hue: number;
}

export interface HuePoint {
  timestamp: string;
  hue: number;
}

export interface StatsSummary {
  totalEvents: number;
  topArticles: ArticleStat[];
  categoryPopularity: CategoryStat[];
  hueHistory: HuePoint[];
}

const MAX_HUE_HISTORY_POINTS = 40;

/**
 * Replays the activity log through the same lazy-decay + circular-mean
 * math the live color engine uses (computeDrift), to reconstruct what the
 * long-term drift hue looked like at each point in time -- purely from
 * the append-only log, with no separate history store needed. Downsampled
 * to a fixed number of points for a clean strip visualization.
 */
function reconstructHueHistory(events: ActivityEvent[], baselineHue: number, tuning: ColorTuning): HuePoint[] {
  if (events.length === 0) return [];

  const weights = new Map<string, { weight: number; lastEventAt: string }>();
  const points: HuePoint[] = [];
  const sorted = [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  for (const event of sorted) {
    const now = Date.parse(event.timestamp);
    const existing = weights.get(event.category);
    const halfLifeMs = tuning.halfLifeHours * 3_600_000;
    const decayed = existing ? existing.weight * Math.pow(0.5, (now - Date.parse(existing.lastEventAt)) / halfLifeMs) : 0;
    weights.set(event.category, { weight: decayed + 1, lastEventAt: event.timestamp });

    const drift = computeDrift(Object.fromEntries(weights), tuning, baselineHue, now);
    points.push({ timestamp: event.timestamp, hue: drift.hue });
  }

  if (points.length <= MAX_HUE_HISTORY_POINTS) return points;
  const step = points.length / MAX_HUE_HISTORY_POINTS;
  return Array.from({ length: MAX_HUE_HISTORY_POINTS }, (_, i) => points[Math.floor(i * step)]);
}

export async function computeStatsSummary(): Promise<StatsSummary> {
  const [events, articles, colorState] = await Promise.all([
    activityLogStore.readAll(),
    articlesStore.list(),
    colorStateStore.read(),
  ]);

  const articleById = new Map(articles.map((a) => [a.id, a]));
  const articleCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const event of events) {
    articleCounts.set(event.articleId, (articleCounts.get(event.articleId) ?? 0) + 1);
    categoryCounts.set(event.category, (categoryCounts.get(event.category) ?? 0) + 1);
  }

  const topArticles: ArticleStat[] = [...articleCounts.entries()]
    .map(([articleId, count]) => {
      const article = articleById.get(articleId);
      return { articleId, title: article?.title ?? "(deleted article)", slug: article?.slug ?? "", count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const categoryPopularity: CategoryStat[] = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count, hue: hueForCategory(category) }))
    .sort((a, b) => b.count - a.count);

  const hueHistory = reconstructHueHistory(events, colorState.baseline.hue, colorState.tuning);

  return { totalEvents: events.length, topArticles, categoryPopularity, hueHistory };
}
