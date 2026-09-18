import { BaseAIClient } from "../base-client";
import type { GenerateTextOptions } from "../types";

export class AnthropicClient extends BaseAIClient {
  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const response = await this.fetchWithTimeout(`${this.config.baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature,
        system: options?.system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((block) => block.type === "text")?.text;
    if (!text) throw new Error("Anthropic API returned no text content");
    return text;
  }
}
