import { BaseAIClient } from "../base-client";
import type { GenerateTextOptions } from "../types";

// Targets any OpenAI chat-completions-compatible endpoint: OpenAI itself,
// or a self-hosted server (Ollama, vLLM, LM Studio, etc.) via a
// custom base URL.
export class OpenAICompatibleClient extends BaseAIClient {
  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const messages = options?.system
      ? [
          { role: "system", content: options.system },
          { role: "user", content: prompt },
        ]
      : [{ role: "user", content: prompt }];

    const response = await this.fetchWithTimeout(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI-compatible API error ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI-compatible API returned no content");
    return text;
  }
}
