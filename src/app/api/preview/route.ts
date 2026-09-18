import { NextResponse, type NextRequest } from "next/server";
import { articlesStore } from "@/lib/storage/articles-store";
import { activityLogStore } from "@/lib/storage/activity-log-store";
import { colorStateStore } from "@/lib/storage/color-state-store";
import { computeCurrentTheme } from "@/lib/color-engine/engine";

// Load-bearing: must recompute the theme and mutate color-engine state
// fresh on every call. See /context.md, "Deliberate Next.js 16 API choices".
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const articleId =
    typeof body === "object" && body !== null && "articleId" in body ? (body as { articleId?: unknown }).articleId : undefined;
  if (typeof articleId !== "string" || articleId.length === 0) {
    return NextResponse.json({ error: "articleId is required" }, { status: 400 });
  }

  // Looks up the article's own category server-side rather than trusting
  // a client-supplied one, so a tampered request can't feed a bogus
  // signal into the color engine.
  const article = await articlesStore.getById(articleId);
  if (!article || article.status !== "published") {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Theme must be computed from history strictly BEFORE this event is
  // recorded (so "long-term drift" doesn't count this click as its own
  // history) -- hence the await here rather than bundling it into the
  // Promise.all below.
  const theme = await computeCurrentTheme({ category: article.category });

  await Promise.all([
    activityLogStore.append({
      articleId: article.id,
      category: article.category,
      event: "preview_open",
      timestamp: new Date().toISOString(),
    }),
    colorStateStore.recordEvent(article.category),
  ]);

  return NextResponse.json({
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      date: article.date,
      category: article.category,
      tags: article.tags,
      format: article.format,
      excerpt: article.excerpt,
      excerptIsFull: article.excerptIsFull,
      readingTimeMinutes: article.readingTimeMinutes,
    },
    cssVars: theme.cssVars,
  });
}
