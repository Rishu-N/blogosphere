const STUCK_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Runs once when a new Next.js server instance starts. Recovers any
 * article left stuck in "processing" by a crash mid-classification (there
 * is no job queue -- classification is a fire-and-forget async call, see
 * src/lib/actions/articles.ts and /context.md). A manual "retry" button in
 * the admin UI is the last-resort fallback if this sweep itself is ever
 * skipped (e.g. a serverless deployment that doesn't run instrumentation
 * the same way).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { articlesStore } = await import("@/lib/storage/articles-store");
    const { retryClassification } = await import("@/lib/actions/articles");

    const articles = await articlesStore.list();
    const now = Date.now();
    const stuck = articles.filter((a) => a.status === "processing" && now - Date.parse(a.updatedAt) > STUCK_THRESHOLD_MS);

    for (const article of stuck) {
      console.warn(`[instrumentation] retrying stuck classification for article ${article.id}`);
      void retryClassification(article.id);
    }
  } catch (err) {
    console.error("[instrumentation] boot-time sweep failed:", err);
  }
}
