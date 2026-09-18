import NewArticleForm from "@/components/admin/NewArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Upload a new article</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Paste Markdown or HTML. Category and tags are assigned automatically after publishing.
      </p>
      <div className="mt-6">
        <NewArticleForm />
      </div>
    </div>
  );
}
