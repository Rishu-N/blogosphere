import PreviewTrigger from "./PreviewTrigger";
import type { HeroContent } from "@/lib/ai/hero-generator";

export default function Hero({ hero }: { hero: HeroContent }) {
  return (
    <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-10">
      <p className="text-lg leading-relaxed text-[var(--color-text)] sm:text-xl">{hero.text}</p>
      {hero.featuredArticle && (
        <div className="mt-5">
          <PreviewTrigger
            articleId={hero.featuredArticle.id}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:opacity-90"
          >
            Preview &ldquo;{hero.featuredArticle.title}&rdquo;
          </PreviewTrigger>
        </div>
      )}
    </header>
  );
}
