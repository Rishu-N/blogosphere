import { promises as fs } from "node:fs";
import { SETTINGS_PATH, SETTINGS_EXAMPLE_PATH } from "./paths";
import { readValidatedJsonFile, updateJsonFile, writeJsonFile } from "./json-file-store";
import { SettingsSchema } from "../validation/schemas";
import { encryptSecret, decryptSecret, isEncryptionConfigured } from "../ai/secret";
import type { Settings, SettingsStore, PublicSettings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  blogger: {
    name: "Anonymous Blogger",
    bio: "Just another mind on the internet, writing things down.",
    avatarUrl: "/avatar-placeholder.svg",
  },
  ai: {
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-5",
    secret: null,
    liveGenerationEnabled: false,
    lastValidatedAt: null,
    lastError: null,
  },
  heroTemplates: [
    'Hi, I’m {{bloggerName}}. {{bloggerBio}} Right now I’m thinking about “{{articleTitle}}”, filed under {{category}}.',
    'Welcome back. I’m {{bloggerName}} — {{bloggerBio}} You might like “{{articleTitle}}”, one of my {{category}} pieces.',
    '{{bloggerName}} here. {{bloggerBio}} Today’s pick: “{{articleTitle}}” ({{category}}).',
  ],
  taxonomy: {
    categories: [
      { key: "technology", label: "Technology", hue: 210, keywords: ["code", "software", "api", "computer", "programming", "app", "tech"] },
      { key: "travel", label: "Travel", hue: 35, keywords: ["trip", "travel", "flight", "city", "country", "journey"] },
      { key: "life", label: "Life", hue: 285, keywords: ["life", "personal", "reflection", "thoughts", "journal"] },
      { key: "food", label: "Food", hue: 25, keywords: ["food", "recipe", "cooking", "restaurant", "meal"] },
      { key: "culture", label: "Culture", hue: 320, keywords: ["art", "music", "book", "film", "culture"] },
      { key: "uncategorized", label: "Uncategorized", hue: 220, keywords: [] },
    ],
  },
  colorEngine: {
    halfLifeHours: 72,
    driftIntensity: 0.6,
    activeInfluence: 0.5,
    jitterAmount: 6,
  },
};

function toPublic(settings: Settings): PublicSettings {
  return {
    version: settings.version,
    updatedAt: settings.updatedAt,
    blogger: settings.blogger,
    ai: {
      provider: settings.ai.provider,
      model: settings.ai.model,
      baseUrl: settings.ai.baseUrl,
      hasApiKey: Boolean(settings.ai.secret),
      liveGenerationEnabled: settings.ai.liveGenerationEnabled,
      lastValidatedAt: settings.ai.lastValidatedAt,
      lastError: settings.ai.lastError,
    },
    heroTemplates: settings.heroTemplates,
    taxonomy: settings.taxonomy,
    colorEngine: settings.colorEngine,
  };
}

export const settingsStore: SettingsStore = {
  async read() {
    return readValidatedJsonFile(SETTINGS_PATH, SettingsSchema, DEFAULT_SETTINGS, "settings.json");
  },

  async readPublic() {
    return toPublic(await this.read());
  },

  async update(mutator) {
    return updateJsonFile(SETTINGS_PATH, DEFAULT_SETTINGS, (current) => {
      const updated = mutator(current);
      updated.updatedAt = new Date().toISOString();
      return updated;
    });
  },

  resolveApiKey(settings) {
    if (!settings.ai.secret || !isEncryptionConfigured()) return null;
    try {
      return decryptSecret(settings.ai.secret);
    } catch {
      return null;
    }
  },
};

export async function setApiKey(plaintextKey: string): Promise<Settings> {
  const encrypted = encryptSecret(plaintextKey);
  return settingsStore.update((settings) => {
    settings.ai.secret = encrypted;
    settings.ai.lastError = null;
    return settings;
  });
}

/** Writes data/settings.example.json (tracked in git) if it doesn't exist yet. Never contains a secret. */
export async function ensureSettingsExampleFile(): Promise<void> {
  const exists = await fs
    .access(SETTINGS_EXAMPLE_PATH)
    .then(() => true)
    .catch(() => false);
  if (exists) return;
  const example: Settings = { ...DEFAULT_SETTINGS, ai: { ...DEFAULT_SETTINGS.ai, secret: null } };
  await writeJsonFile(SETTINGS_EXAMPLE_PATH, example);
}
