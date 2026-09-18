import { ulid } from "ulid";
import { HERO_POOL_PATH } from "../storage/paths";
import { readValidatedJsonFile, updateJsonFile } from "../storage/json-file-store";
import { HeroPoolSchema } from "../validation/schemas";
import { settingsStore } from "../storage/settings-store";
import { createAIClient } from "./client";
import type { ArticleMeta, HeroPool, HeroPoolEntry } from "../storage/types";

const DEFAULT_POOL: HeroPool = { version: 1, lastRefreshAt: new Date(0).toISOString(), entries: [] };
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const POOL_SIZE = 10;

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export interface HeroContent {
  text: string;
  source: "template" | "ai-pool";
  featuredArticle: ArticleMeta | null;
}

/**
 * Renders the hero's text for THIS request. Never calls an AI provider
 * inline on the request path -- either fills an admin-editable template,
 * or serves an already-generated pool entry. Call refreshHeroPoolIfDue()
 * separately (fire-and-forget) to keep the pool topped up in the background.
 */
export async function getHeroContent(articles: ArticleMeta[]): Promise<HeroContent> {
  const settings = await settingsStore.read();
  const published = articles.filter((a) => a.status === "published");
  const featuredArticle = pickRandom(published) ?? null;

  if (settings.ai.liveGenerationEnabled) {
    const pool = await readValidatedJsonFile(HERO_POOL_PATH, HeroPoolSchema, DEFAULT_POOL, "hero-pool.json");
    const matching = pool.entries.filter((e) => featuredArticle && e.articleId === featuredArticle.id);
    const entry = pickRandom(matching.length > 0 ? matching : pool.entries);
    if (entry) {
      return { text: entry.text, source: "ai-pool", featuredArticle };
    }
  }

  const template = pickRandom(settings.heroTemplates) ?? "{{bloggerName}}: {{bloggerBio}}";
  const text = fillTemplate(template, {
    bloggerName: settings.blogger.name,
    bloggerBio: settings.blogger.bio,
    articleTitle: featuredArticle?.title ?? "something new",
    category: featuredArticle?.category ?? "life",
  });
  return { text, source: "template", featuredArticle };
}

/**
 * Fire-and-forget: tops up the hero pool if it's stale or thin. Safe to
 * call (unawaited) on every homepage render -- a no-op unless live
 * generation is on, a key is configured, and the pool actually needs it.
 */
export async function refreshHeroPoolIfDue(articles: ArticleMeta[]): Promise<void> {
  const settings = await settingsStore.read();
  if (!settings.ai.liveGenerationEnabled) return;
  const apiKey = settingsStore.resolveApiKey(settings);
  if (!apiKey) return;

  const pool = await readValidatedJsonFile(HERO_POOL_PATH, HeroPoolSchema, DEFAULT_POOL, "hero-pool.json");
  const isStale = Date.now() - Date.parse(pool.lastRefreshAt) > REFRESH_INTERVAL_MS;
  if (!isStale && pool.entries.length >= POOL_SIZE) return;

  const published = articles.filter((a) => a.status === "published");
  const article = pickRandom(published);
  if (!article) return;

  try {
    const client = createAIClient({
      provider: settings.ai.provider,
      baseUrl: settings.ai.baseUrl,
      model: settings.ai.model,
      apiKey,
    });
    const text = await client.generateText(
      `Write one warm, first-person sentence (max 40 words) for a blog's homepage hero. ` +
        `The blogger is ${settings.blogger.name}: ${settings.blogger.bio}. ` +
        `Mention their article "${article.title}" (category: ${article.category}) as something worth reading. ` +
        `Output only the sentence, no quotes, no preamble.`,
      { maxTokens: 120, temperature: 0.9 }
    );
    const entry: HeroPoolEntry = {
      id: ulid(),
      articleId: article.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    await updateJsonFile(HERO_POOL_PATH, DEFAULT_POOL, (current): HeroPool => ({
      version: 1,
      lastRefreshAt: new Date().toISOString(),
      entries: [entry, ...current.entries].slice(0, POOL_SIZE),
    }));
    await settingsStore.update((s) => {
      s.ai.lastValidatedAt = new Date().toISOString();
      s.ai.lastError = null;
      return s;
    });
  } catch (err) {
    console.warn("[ai] hero pool refresh failed:", err);
    await settingsStore
      .update((s) => {
        s.ai.lastError = String(err);
        return s;
      })
      .catch(() => {});
  }
}
