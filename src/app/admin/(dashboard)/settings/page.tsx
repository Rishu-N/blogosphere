import { settingsStore } from "@/lib/storage/settings-store";
import AIProviderForm from "@/components/admin/AIProviderForm";
import {
  updateBloggerSettings,
  updateHeroTemplates,
  updateColorEngineTuning,
  resetColorEngineState,
  addTaxonomyCategory,
  removeTaxonomyCategory,
} from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AdminSettingsPage() {
  const settings = await settingsStore.readPublic();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>

      <Section title="Blogger" description="Shown in the hero section and site metadata.">
        <form action={updateBloggerSettings} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-muted)]">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={settings.blogger.name}
              className="mt-1 w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)]"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[var(--color-text-muted)]">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={settings.blogger.bio}
              className="mt-1 w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)]"
            />
          </div>
          <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)]">
            Save
          </button>
        </form>
      </Section>

      <Section
        title="AI integration"
        description="Shared by the hero-text generator and background article classification. Off by default; templates and the heuristic classifier work with no key at all."
      >
        <AIProviderForm ai={settings.ai} />
      </Section>

      <Section title="Hero templates" description="One per line. Placeholders: {{bloggerName}}, {{bloggerBio}}, {{articleTitle}}, {{category}}.">
        <form action={updateHeroTemplates} className="space-y-4">
          <textarea
            name="templates"
            rows={6}
            defaultValue={settings.heroTemplates.join("\n")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text)]"
          />
          <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)]">
            Save templates
          </button>
        </form>
      </Section>

      <Section
        title="Color engine tuning"
        description="How the living color scheme drifts. Changes apply on the next render; resetting clears all learned history back to baseline."
      >
        <form action={updateColorEngineTuning} className="flex flex-wrap gap-4">
          <TuningField label="Half-life (hours)" name="halfLifeHours" defaultValue={settings.colorEngine.halfLifeHours} step={1} />
          <TuningField label="Drift intensity (0-1)" name="driftIntensity" defaultValue={settings.colorEngine.driftIntensity} step={0.05} />
          <TuningField label="Active-preview influence (0-1)" name="activeInfluence" defaultValue={settings.colorEngine.activeInfluence} step={0.05} />
          <TuningField label="Jitter amount (degrees)" name="jitterAmount" defaultValue={settings.colorEngine.jitterAmount} step={1} />
          <div className="flex w-full items-center gap-3">
            <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)]">
              Save tuning
            </button>
          </div>
        </form>
        <form action={resetColorEngineState} className="mt-4">
          <button type="submit" className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700">
            Reset color state to baseline
          </button>
        </form>
      </Section>

      <Section title="Taxonomy" description="Categories the classifier can choose from. Keywords power the offline heuristic fallback.">
        <div className="space-y-2">
          {settings.taxonomy.categories.map((category) => (
            <div
              key={category.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
            >
              <div>
                <span className="font-medium text-[var(--color-text)]">{category.label}</span>
                <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                  ({category.key}, hue {category.hue}
                  {category.keywords.length > 0 ? `, keywords: ${category.keywords.join(", ")}` : ""})
                </span>
              </div>
              <form action={removeTaxonomyCategory.bind(null, category.key)}>
                <button type="submit" className="text-xs font-medium text-red-700 hover:underline">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>

        <form action={addTaxonomyCategory} className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <div>
            <label htmlFor="key" className="block text-xs font-medium text-[var(--color-text-muted)]">
              Key
            </label>
            <input
              id="key"
              name="key"
              required
              placeholder="travel"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] sm:w-32"
            />
          </div>
          <div>
            <label htmlFor="label" className="block text-xs font-medium text-[var(--color-text-muted)]">
              Label
            </label>
            <input
              id="label"
              name="label"
              required
              placeholder="Travel"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] sm:w-32"
            />
          </div>
          <div>
            <label htmlFor="hue" className="block text-xs font-medium text-[var(--color-text-muted)]">
              Hue (0-360)
            </label>
            <input
              id="hue"
              name="hue"
              type="number"
              min={0}
              max={360}
              defaultValue={200}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] sm:w-24"
            />
          </div>
          <div className="col-span-2 sm:min-w-[180px] sm:flex-1">
            <label htmlFor="keywords" className="block text-xs font-medium text-[var(--color-text-muted)]">
              Keywords (comma-separated)
            </label>
            <input
              id="keywords"
              name="keywords"
              placeholder="beach, flight, passport"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)]"
            />
          </div>
          <button
            type="submit"
            className="col-span-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] sm:col-span-1"
          >
            Add category
          </button>
        </form>
      </Section>
    </div>
  );
}

function TuningField({ label, name, defaultValue, step }: { label: string; name: string; defaultValue: number; step: number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        step={step}
        defaultValue={defaultValue}
        className="mt-1 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
      />
    </div>
  );
}
