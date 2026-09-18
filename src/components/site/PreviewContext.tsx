"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { ArticleMeta } from "@/lib/storage/types";

export type PreviewArticle = Pick<
  ArticleMeta,
  "id" | "slug" | "title" | "date" | "category" | "tags" | "format" | "excerpt" | "excerptIsFull" | "readingTimeMinutes"
>;

interface PreviewContextValue {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  article: PreviewArticle | null;
  openPreview: (articleId: string) => void;
  closePreview: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used within a PreviewProvider");
  return ctx;
}

// Must match the keys produced by deriveCssVars() in src/lib/color-engine/css-vars.ts.
const THEME_VAR_NAMES = [
  "--color-bg",
  "--color-surface",
  "--color-accent",
  "--color-accent-soft",
  "--color-accent-2",
  "--color-border",
  "--color-text",
  "--color-text-muted",
  "--color-text-on-accent",
];

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<PreviewArticle | null>(null);
  // The server-computed ambient theme, captured once before the first
  // mutation, so closing a preview can restore it instead of guessing.
  const ambientVarsRef = useRef<Record<string, string> | null>(null);

  const captureAmbientOnce = useCallback(() => {
    if (ambientVarsRef.current) return;
    const computed = getComputedStyle(document.documentElement);
    const snapshot: Record<string, string> = {};
    for (const name of THEME_VAR_NAMES) snapshot[name] = computed.getPropertyValue(name).trim();
    ambientVarsRef.current = snapshot;
  }, []);

  const openPreview = useCallback(
    (articleId: string) => {
      captureAmbientOnce();
      setIsOpen(true);
      setIsLoading(true);
      setError(null);

      fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load that preview.");
          const data = (await response.json()) as { article: PreviewArticle; cssVars: Record<string, string> };
          setArticle(data.article);
          for (const [key, value] of Object.entries(data.cssVars)) {
            document.documentElement.style.setProperty(key, value);
          }
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        })
        .finally(() => setIsLoading(false));
    },
    [captureAmbientOnce]
  );

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setArticle(null);
    setError(null);
    if (ambientVarsRef.current) {
      for (const [key, value] of Object.entries(ambientVarsRef.current)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, []);

  return (
    <PreviewContext.Provider value={{ isOpen, isLoading, error, article, openPreview, closePreview }}>
      {children}
    </PreviewContext.Provider>
  );
}
