import { retext } from "retext";
import retextEnglish from "retext-english";
import retextSpell from "retext-spell";
import dictionaryEn from "dictionary-en";

export interface SpellcheckIssue {
  word: string;
  suggestions: string[];
  index: number;
}

interface RetextSpellMessage {
  actual?: string;
  expected?: string[];
  place?: { start?: { offset?: number }; end?: { offset?: number } };
}

/**
 * Offline, deterministic spelling check (no AI provider involved) over
 * already-plain-text content. Purely advisory -- callers decide whether to
 * block publishing on the results.
 */
export async function checkSpellingPlainText(plainText: string): Promise<SpellcheckIssue[]> {
  if (!plainText.trim()) return [];
  const file = await retext().use(retextEnglish).use(retextSpell, dictionaryEn).process(plainText);

  return file.messages.map((message) => {
    const m = message as unknown as RetextSpellMessage;
    const start = m.place?.start?.offset;
    const end = m.place?.end?.offset;
    const word = start !== undefined && end !== undefined ? plainText.slice(start, end) : m.actual ?? String(message.message);
    return {
      word,
      suggestions: (m.expected ?? []).slice(0, 5),
      index: start ?? 0,
    };
  });
}
