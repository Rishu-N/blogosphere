"use client";

import { useState } from "react";
import { updateAIProviderSettings, clearAIProviderKey } from "@/lib/actions/settings";
import { AI_PRESETS } from "@/lib/ai/presets";
import type { PublicAISettings, AIProviderKind } from "@/lib/storage/types";

export default function AIProviderForm({ ai }: { ai: PublicAISettings }) {
  const [provider, setProvider] = useState<AIProviderKind>(ai.provider);
  const [baseUrl, setBaseUrl] = useState(ai.baseUrl);
  const [model, setModel] = useState(ai.model);

  function handleProviderChange(next: string) {
    const kind = (["anthropic", "openai", "gemini", "custom"] as const).includes(next as AIProviderKind)
      ? (next as AIProviderKind)
      : "anthropic";
    setProvider(kind);
    if (kind !== "custom") {
      setBaseUrl(AI_PRESETS[kind].baseUrl);
      setModel((current) => current || AI_PRESETS[kind].defaultModel);
    }
  }

  return (
    <form action={updateAIProviderSettings} className="space-y-4">
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-[var(--color-text-muted)]">
          Provider
        </label>
        <select
          id="provider"
          name="provider"
          value={provider}
          onChange={(event) => handleProviderChange(event.target.value)}
          className="mt-1 w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
        >
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="custom">Custom (self-hosted, OpenAI-compatible)</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="model" className="block text-sm font-medium text-[var(--color-text-muted)]">
            Model name
          </label>
          <input
            id="model"
            name="model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="e.g. claude-sonnet-5"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label htmlFor="baseUrl" className="block text-sm font-medium text-[var(--color-text-muted)]">
            Base URL {provider !== "custom" && <span className="text-xs">(preset -- override if needed)</span>}
          </label>
          <input
            id="baseUrl"
            name="baseUrl"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-[var(--color-text-muted)]">
          API key {ai.hasApiKey && <span className="text-xs text-emerald-700">(currently set -- leave blank to keep it)</span>}
        </label>
        <input
          id="apiKey"
          type="password"
          name="apiKey"
          autoComplete="off"
          placeholder={ai.hasApiKey ? "••••••••" : "paste your API key"}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
        <input type="checkbox" name="liveGenerationEnabled" defaultChecked={ai.liveGenerationEnabled} />
        Enable live AI hero generation (falls back to templates automatically if the key is missing or a call fails)
      </label>

      {ai.lastError && <p className="text-sm text-red-600">Last error: {ai.lastError}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)]">
          Save AI settings
        </button>
        {ai.hasApiKey && (
          <button
            type="submit"
            formAction={clearAIProviderKey}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
          >
            Remove key
          </button>
        )}
      </div>
    </form>
  );
}
