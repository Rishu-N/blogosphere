"use server";

import { revalidatePath } from "next/cache";
import { settingsStore, setApiKey } from "@/lib/storage/settings-store";
import { colorStateStore } from "@/lib/storage/color-state-store";
import { AI_PRESETS } from "@/lib/ai/presets";
import type { AIProviderKind, ColorTuning } from "@/lib/storage/types";

export async function updateBloggerSettings(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  await settingsStore.update((s) => ({
    ...s,
    blogger: {
      name: name || s.blogger.name,
      bio: bio || s.blogger.bio,
      avatarUrl: avatarUrl || s.blogger.avatarUrl,
    },
  }));

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

function isAIProviderKind(value: string): value is AIProviderKind {
  return value === "anthropic" || value === "openai" || value === "gemini" || value === "custom";
}

export async function updateAIProviderSettings(formData: FormData): Promise<void> {
  const providerInput = String(formData.get("provider") ?? "anthropic");
  const provider = isAIProviderKind(providerInput) ? providerInput : "anthropic";
  const model = String(formData.get("model") ?? "").trim();
  const baseUrlInput = String(formData.get("baseUrl") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const liveGenerationEnabled = formData.get("liveGenerationEnabled") === "on";

  const presetBaseUrl = provider !== "custom" ? AI_PRESETS[provider].baseUrl : "";

  await settingsStore.update((s) => ({
    ...s,
    ai: {
      ...s.ai,
      provider,
      model: model || s.ai.model,
      baseUrl: baseUrlInput || presetBaseUrl || s.ai.baseUrl,
      liveGenerationEnabled,
    },
  }));

  if (apiKey) {
    await setApiKey(apiKey);
  }

  revalidatePath("/admin/settings");
}

export async function clearAIProviderKey(): Promise<void> {
  await settingsStore.update((s) => ({
    ...s,
    ai: { ...s.ai, secret: null, liveGenerationEnabled: false },
  }));
  revalidatePath("/admin/settings");
}

export async function updateHeroTemplates(formData: FormData): Promise<void> {
  const raw = String(formData.get("templates") ?? "");
  const templates = raw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  if (templates.length === 0) return;

  await settingsStore.update((s) => ({ ...s, heroTemplates: templates }));
  revalidatePath("/admin/settings");
}

function parseTuningField(formData: FormData, key: string, min: number, max: number): number | undefined {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

export async function updateColorEngineTuning(formData: FormData): Promise<void> {
  const partial: Partial<ColorTuning> = {
    halfLifeHours: parseTuningField(formData, "halfLifeHours", 1, 24 * 30),
    driftIntensity: parseTuningField(formData, "driftIntensity", 0, 1),
    activeInfluence: parseTuningField(formData, "activeInfluence", 0, 1),
    jitterAmount: parseTuningField(formData, "jitterAmount", 0, 60),
  };
  const cleaned = Object.fromEntries(Object.entries(partial).filter(([, v]) => v !== undefined)) as Partial<ColorTuning>;

  await settingsStore.update((s) => ({ ...s, colorEngine: { ...s.colorEngine, ...cleaned } }));
  await colorStateStore.updateTuning(cleaned);
  revalidatePath("/admin/settings");
}

export async function resetColorEngineState(): Promise<void> {
  await colorStateStore.reset();
  revalidatePath("/admin/settings");
  revalidatePath("/admin/stats");
}

export async function addTaxonomyCategory(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const label = String(formData.get("label") ?? "").trim();
  const hue = Number(formData.get("hue"));
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  if (!key || !label) return;

  await settingsStore.update((s) => {
    if (s.taxonomy.categories.some((c) => c.key === key)) return s;
    return {
      ...s,
      taxonomy: {
        categories: [...s.taxonomy.categories, { key, label, hue: Number.isFinite(hue) ? hue : 200, keywords }],
      },
    };
  });
  revalidatePath("/admin/settings");
}

export async function removeTaxonomyCategory(key: string): Promise<void> {
  await settingsStore.update((s) => ({
    ...s,
    taxonomy: { categories: s.taxonomy.categories.filter((c) => c.key !== key) },
  }));
  revalidatePath("/admin/settings");
}
