export interface AIPreset {
  label: string;
  baseUrl: string;
  defaultModel: string;
}

// "custom" deliberately has no entry here -- it leaves baseUrl editable in
// the Settings UI for self-hosted OpenAI-compatible servers (Ollama, vLLM,
// LM Studio, etc.) and has no sensible default model to suggest.
export const AI_PRESETS: Record<"anthropic" | "openai" | "gemini", AIPreset> = {
  anthropic: { label: "Anthropic", baseUrl: "https://api.anthropic.com", defaultModel: "claude-sonnet-5" },
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-5" },
  gemini: { label: "Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", defaultModel: "gemini-2.5-flash" },
};
