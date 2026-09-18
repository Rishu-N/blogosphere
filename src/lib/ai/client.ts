import type { AIClient, AIProviderConfig } from "./types";
import { AnthropicClient } from "./providers/anthropic";
import { OpenAICompatibleClient } from "./providers/openai-compatible";
import { GeminiClient } from "./providers/gemini";

export function createAIClient(config: AIProviderConfig): AIClient {
  switch (config.provider) {
    case "anthropic":
      return new AnthropicClient(config);
    case "gemini":
      return new GeminiClient(config);
    case "openai":
    case "custom":
    default:
      return new OpenAICompatibleClient(config);
  }
}

export type { AIClient, AIProviderConfig, ClassifyResult, GenerateTextOptions } from "./types";
