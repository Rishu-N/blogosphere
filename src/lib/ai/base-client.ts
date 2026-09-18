import type { AIClient, AIProviderConfig, ClassifyResult, GenerateTextOptions } from "./types";

const CLASSIFY_SYSTEM_PROMPT =
  "You are a strict content classifier for a personal blog. Given an article's plain-text " +
  "content and a fixed list of allowed category keys, respond with ONLY a JSON object of the " +
  'shape {"category": "<one of the allowed keys>", "tags": ["...", "..."], "confidence": 0.0-1.0}. ' +
  "Pick exactly one category from the allowed list (never invent a new one), 1-5 short lowercase " +
  "tags, and a confidence between 0 and 1. Output nothing but the JSON object.";

function buildClassifyPrompt(content: string, taxonomy: string[]): string {
  const truncated = content.length > 6000 ? content.slice(0, 6000) + "…" : content;
  return `Allowed category keys: ${taxonomy.join(", ")}\n\nArticle content:\n"""\n${truncated}\n"""`;
}

function parseClassifyJson(raw: string, taxonomy: string[]): ClassifyResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI classify response did not contain a JSON object");
  const parsed = JSON.parse(match[0]) as { category?: unknown; tags?: unknown; confidence?: unknown };
  const category = typeof parsed.category === "string" && taxonomy.includes(parsed.category) ? parsed.category : taxonomy[taxonomy.length - 1];
  const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === "string").slice(0, 5) : [];
  const confidence =
    typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence) ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5;
  return { category, tags, confidence };
}

/**
 * Shared classify() on top of each provider's generateText(), so the
 * JSON-extraction/validation logic isn't duplicated per provider.
 */
export abstract class BaseAIClient implements AIClient {
  constructor(protected config: AIProviderConfig) {}

  abstract generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;

  async classify(content: string, taxonomy: string[]): Promise<ClassifyResult> {
    if (taxonomy.length === 0) throw new Error("classify() requires at least one taxonomy category");
    const raw = await this.generateText(buildClassifyPrompt(content, taxonomy), {
      system: CLASSIFY_SYSTEM_PROMPT,
      maxTokens: 200,
      temperature: 0.2,
    });
    return parseClassifyJson(raw, taxonomy);
  }

  protected async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const timeoutMs = this.config.timeoutMs ?? 15_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
