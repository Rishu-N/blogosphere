import { BaseAIClient } from "../base-client";
import type { GenerateTextOptions } from "../types";

export class GeminiClient extends BaseAIClient {
  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const base = this.config.baseUrl.replace(/\/$/, "");
    const url = `${base}/models/${this.config.model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;
    const fullPrompt = options?.system ? `${options.system}\n\n${prompt}` : prompt;

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 512,
          temperature: options?.temperature,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini API returned no content");
    return text;
  }
}
