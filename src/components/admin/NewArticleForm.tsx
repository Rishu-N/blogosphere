"use client";

import { useState } from "react";
import { checkArticleSpelling, createArticle, type SpellcheckIssue } from "@/lib/actions/articles";

export default function NewArticleForm() {
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [content, setContent] = useState("");
  const [defaultDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [issues, setIssues] = useState<SpellcheckIssue[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function handleCheckSpelling() {
    setIsChecking(true);
    try {
      const result = await checkArticleSpelling(content, format);
      setIssues(result);
    } finally {
      setIsChecking(false);
    }
  }

  function handleContentChange(value: string) {
    setContent(value);
    setIssues(null); // a stale review no longer reflects the current draft
  }

  return (
    <form action={createArticle} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-muted)]">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-[var(--color-text-muted)]">
            Published date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            defaultValue={defaultDate}
            className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </div>
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-[var(--color-text-muted)]">
            Format
          </label>
          <select
            id="format"
            name="format"
            value={format}
            onChange={(event) => setFormat(event.target.value === "html" ? "html" : "markdown")}
            className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          >
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-[var(--color-text-muted)]">
          Content ({format})
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={16}
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCheckSpelling}
          disabled={isChecking || !content.trim()}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
        >
          {isChecking ? "Checking…" : "Check spelling"}
        </button>
        {issues !== null && (
          <span className="text-sm text-[var(--color-text-muted)]">
            {issues.length === 0 ? "No issues found." : `${issues.length} possible issue${issues.length === 1 ? "" : "s"} found.`}
          </span>
        )}
      </div>

      {issues !== null && issues.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-3 text-sm">
          {issues.map((issue, index) => (
            <li key={`${issue.word}-${index}`}>
              <span className="font-medium text-[var(--color-text)]">{issue.word}</span>
              {issue.suggestions.length > 0 && (
                <span className="text-[var(--color-text-muted)]"> — did you mean: {issue.suggestions.join(", ")}?</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-medium text-[var(--color-text-on-accent)]">
          Publish
        </button>
        {issues !== null && issues.length > 0 && (
          <span className="text-sm text-[var(--color-text-muted)]">You can publish anyway, or edit the content above first.</span>
        )}
      </div>
    </form>
  );
}
