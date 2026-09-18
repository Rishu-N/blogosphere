import type { ClassifyResult } from "./types";
import type { TaxonomyCategory } from "../storage/types";

/**
 * Zero-dependency, zero-API fallback classifier. Scores plain-text content
 * against each taxonomy category's admin-editable keyword list. Used
 * whenever no AI provider is configured, or a live classify() call fails,
 * so categorization -- and therefore the color engine's category signal --
 * never hard-depends on having an API key.
 */
export function heuristicClassify(content: string, categories: TaxonomyCategory[]): ClassifyResult {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const wordSet = new Set(words);

  let best: { key: string; score: number } | null = null;
  for (const category of categories) {
    if (category.keywords.length === 0) continue;
    let score = 0;
    for (const keyword of category.keywords) {
      if (wordSet.has(keyword.toLowerCase())) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { key: category.key, score };
    }
  }

  const fallbackKey = categories.find((c) => c.key === "uncategorized")?.key ?? categories[0]?.key ?? "uncategorized";
  if (!best) {
    return { category: fallbackKey, tags: [], confidence: 0 };
  }

  const wordFrequency = new Map<string, number>();
  for (const word of words) {
    if (word.length < 4) continue;
    wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
  }
  const tags = [...wordFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  return { category: best.key, tags, confidence: Math.min(1, best.score / 5) };
}
