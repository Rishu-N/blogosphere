import type { AIProviderKind } from "../storage/types";

export type { AIProviderKind };

export interface AIProviderConfig {
  provider: AIProviderKind;
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs?: number;
}

export interface GenerateTextOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClassifyResult {
  category: string;
  tags: string[];
  confidence: number;
}

export interface AIClient {
  generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
  classify(content: string, taxonomy: string[]): Promise<ClassifyResult>;
}
