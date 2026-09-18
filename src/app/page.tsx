import { articlesStore } from "@/lib/storage/articles-store";
import { getHeroContent, refreshHeroPoolIfDue } from "@/lib/ai/hero-generator";
import { PreviewProvider } from "@/components/site/PreviewContext";
import PreviewModal from "@/components/site/PreviewModal";
import Hero from "@/components/site/Hero";
import ArticleList from "@/components/site/ArticleList";
import Sidebar from "@/components/site/Sidebar";
import type { ArticleMeta } from "@/lib/storage/types";

// Load-bearing, same reason as layout.tsx: the sidebar's random pick and
// the color-engine-dependent hero must be fresh every visit, never cached.
export const dynamic = "force-dynamic";

function pickRandomDistinct(items: ArticleMeta[], count: number): ArticleMeta[] {
  const pool = [...items];
  const picked: ArticleMeta[] = [];
  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export default async function HomePage() {
  const articles = await articlesStore.list();
  const published = articles.filter((a) => a.status === "published");

  const hero = await getHeroContent(published);
  // Fire-and-forget: tops up the hero pool in the background if it's due.
  // Never awaited -- see /context.md for why that's safe on a persistent
  // Node process and what would need to change on serverless.
  void refreshHeroPoolIfDue(published);

  const highlightPool = published.filter((a) => a.id !== hero.featuredArticle?.id);
  const highlighted = pickRandomDistinct(highlightPool, 3);

  return (
    <PreviewProvider>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Hero hero={hero} />
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
          <ArticleList articles={published} />
          <Sidebar articles={highlighted} />
        </div>
      </div>
      <PreviewModal />
    </PreviewProvider>
  );
}
