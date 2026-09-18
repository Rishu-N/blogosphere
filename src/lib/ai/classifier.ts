import { settingsStore } from "../storage/settings-store";
import { createAIClient } from "./client";
import { heuristicClassify } from "./heuristic-classify";
import type { ClassifyResult } from "./types";

export interface ClassifyOutcome extends ClassifyResult {
  method: "ai" | "heuristic";
  error?: string;
}

/**
 * Classifies raw plain-text article content into one of the admin's
 * taxonomy categories. Tries the configured AI provider first (if any key
 * is set); on missing config or any failure/timeout, falls back to the
 * offline heuristic classifier so this never throws and never blocks on
 * an unavailable API.
 */
export async function classifyArticle(content: string): Promise<ClassifyOutcome> {
  const settings = await settingsStore.read();
  const categories = settings.taxonomy.categories;
  const taxonomyKeys = categories.map((c) => c.key);
  const apiKey = settingsStore.resolveApiKey(settings);

  if (apiKey) {
    try {
      const client = createAIClient({
        provider: settings.ai.provider,
        baseUrl: settings.ai.baseUrl,
        model: settings.ai.model,
        apiKey,
      });
      const result = await client.classify(content, taxonomyKeys);
      return { ...result, method: "ai" };
    } catch (err) {
      console.warn("[ai] classify failed, falling back to heuristic classifier:", err);
      return { ...heuristicClassify(content, categories), method: "heuristic", error: String(err) };
    }
  }

  return { ...heuristicClassify(content, categories), method: "heuristic" };
}
