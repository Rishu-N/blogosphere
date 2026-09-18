# Blogosphere — Project Context

> Living document. Updated at the end of every work session / phase checkpoint.
> Last updated: 2026-09-18 by Claude (Phase 1 checkpoint)

## 1. Vision

A personal blog that feels alive rather than static. An AI/template-driven hero
section describes the blogger and rotates a highlighted article; the homepage
lists all articles with a lightweight preview (first section, or the whole
thing if short) plus a sidebar of 3 randomly-chosen highlights. The
centerpiece feature is a site-wide color scheme that slowly evolves based on
which articles get opened — decaying over time, jittering a little on every
visit — so the site behaves like a living organism rather than a fixed skin.
The admin/owner gets a dashboard to upload Markdown/HTML articles (with an
offline spellcheck before publish and automatic background categorization
after), tune settings, and see stats. AI features (hero text, classification)
are admin-configurable against Anthropic, OpenAI, Gemini, or any
OpenAI-compatible self-hosted endpoint, off by default with a template
fallback.

The full design rationale (data schemas, the color-engine algorithm, the AI
provider abstraction, risks considered) lives in the approved plan at
`/root/.claude/plans/i-need-to-make-robust-balloon.md` on the machine that
built this — if that file isn't available to you, this document plus the
source code are the authoritative reference going forward.

## 2. Current Status (at a glance)

- **Phase: 1 (Foundation & storage layer) — nearly complete, about to commit.**
- Runs via `npm run dev` (not yet verified end-to-end — no UI exists yet).
- Not yet deployed anywhere. Deployment target is still an open decision — see
  section 7. Everything is built assuming a single persistent Node process.
- Known-empty areas: there is no UI yet at all (no homepage content beyond the
  Next.js scaffold default, no color engine, no AI code, no admin dashboard).
  Phases 2-6 are all still pending.

## 3. Architecture Snapshot

- **Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, React 19.
  Scaffolded with `create-next-app` — Node.js runtime throughout (no Edge).
- **Storage:** `/data` (JSON/JSONL) + `/content/articles` (raw MD/HTML
  source), accessed **only** through the interfaces in
  `src/lib/storage/types.ts` — every store module implements one of
  `ArticlesStore`, `ColorStateStore`, `ActivityLogStore`, `SettingsStore`.
  Never call `fs` directly outside `src/lib/storage/*`; this boundary is what
  would let a future maintainer swap local JSON files for a real database
  without touching the rest of the app.
- **Deliberate Next.js 16 API choices** (verified against the docs bundled in
  `node_modules/next/dist/docs/`, since this Next version may differ from an
  agent's training data — see the auto-generated `AGENTS.md`):
  - `cacheComponents` is **intentionally left disabled** in `next.config.ts`.
    This keeps the classic `export const dynamic = "force-dynamic"` /
    `revalidate` route-segment-config model available, which the color engine
    depends on for true per-request rendering. **Do not enable
    `cacheComponents`** without redesigning how the color engine forces fresh
    renders (it uses Cache Components' `use cache` opt-in model instead,
    which is the opposite default).
  - The admin auth gate belongs in **`src/proxy.ts`** (exported function
    named `proxy`), not `middleware.ts` — Next 16 renamed/deprecated
    Middleware in favor of Proxy. Not yet created (that's Phase 5).
- **Module map so far:**
  | Module | Path | Purpose |
  |---|---|---|
  | Types | `src/lib/storage/types.ts` | Every data shape + the 4 store interfaces |
  | Paths | `src/lib/storage/paths.ts` | Resolves DATA_DIR/CONTENT_DIR, builds article source paths |
  | Atomic JSON store | `src/lib/storage/json-file-store.ts` | Per-path write queue + atomic temp-file-then-rename + zod-validated reads |
  | Validation | `src/lib/validation/schemas.ts` | zod schemas mirroring every JSON shape |
  | Articles store | `src/lib/storage/articles-store.ts` | CRUD over articles-index.json + raw content files |
  | Color state store | `src/lib/storage/color-state-store.ts` | Lazy-decay category weights; `decayedWeight()` exported for reuse by the engine (Phase 3) |
  | Activity log store | `src/lib/storage/activity-log-store.ts` | Append-only JSONL + CSV export |
  | Settings store | `src/lib/storage/settings-store.ts` | Blogger/AI/taxonomy/color-tuning config; `readPublic()` strips the API key |
  | Secret encryption | `src/lib/ai/secret.ts` | AES-256-GCM encrypt/decrypt for the AI provider API key, keyed by `SETTINGS_ENCRYPTION_KEY` |
  | Barrel | `src/lib/storage/index.ts` | Re-exports the above |

## 4. Completed So Far

- [x] 2026-09-18 — Phase 1: Next.js/TS/Tailwind v4 scaffold via create-next-app
      (`src` dir, App Router, `@/*` import alias). Checked Next 16 docs for
      Proxy-vs-Middleware and Cache Components before writing any app code.
- [x] 2026-09-18 — Phase 1: storage interfaces + JSON/JSONL implementations +
      atomic-write/per-path-queue helper + zod validation-on-read (corrupted
      file → log loudly, fall back to defaults, never crash).
- [x] 2026-09-18 — Phase 1: AES-256-GCM secret encryption helper for the AI
      API key.
- [x] 2026-09-18 — Phase 1: seed content (2 example articles, one Markdown
      one HTML, one long/one short) + `data/articles-index.json` +
      `data/settings.example.json`, `.env.example`.
- [x] 2026-09-18 — Phase 1: `.gitignore` updated — runtime data files
      (`settings.json`, `color-state.json`, `activity-log.jsonl`,
      `hero-pool.json`) ignored; `content/articles/*`,
      `data/articles-index.json`, `data/settings.example.json` tracked. Fixed
      a `.env*` glob that would have silently also ignored `.env.example`.
- [ ] Phase 2 — Public site UI
- [ ] Phase 3 — Living color engine
- [ ] Phase 4 — AI provider abstraction
- [ ] Phase 5 — Admin dashboard
- [ ] Phase 6 — Polish & verification

## 5. Key Decisions Log (append-only — strike through if superseded, don't delete)

- 2026-09-18 — Next.js full-stack (App Router + TS + Tailwind v4), one app,
  chosen over a split frontend/backend, per explicit user preference.
- 2026-09-18 — AI hero generation defaults OFF; admin-editable templates are
  the baseline, live generation is opt-in once a provider is configured, per
  explicit user requirement.
- 2026-09-18 — AI provider config is "OpenAI-style" (model + base URL + key)
  with one-click presets for Anthropic/OpenAI/Gemini and a Custom mode for
  self-hosted OpenAI-compatible endpoints, per explicit user requirement.
- 2026-09-18 — Deployment target left undecided by the user; default
  assumption is a single persistent Node process, with the storage layer
  abstracted behind interfaces specifically so a DB swap is possible later
  without an app-wide rewrite.
- 2026-09-18 — No frontmatter parsing (no `gray-matter`): article metadata
  (title/date/etc.) is supplied by the admin through the upload form, not
  parsed out of the raw MD/HTML body. Keeps ingestion simpler.
- 2026-09-18 — `cacheComponents` left disabled (see Architecture Snapshot) —
  a deliberate choice, not an oversight.
- 2026-09-18 — Article IDs are ULIDs (sortable, URL-safe); slugs are meant to
  be generated once at creation and never changed afterward (not yet
  enforced in code — that lands with the Phase 5 upload flow).
- 2026-09-18 — Commit at the end of each phase (not mid-phase); maintain this
  file at every such checkpoint, per explicit user requirement for a clean
  handoff.

## 6. Data Shapes Reference

Pointer, not a copy — see `src/lib/storage/types.ts` (TypeScript interfaces)
and `src/lib/validation/schemas.ts` (zod schemas, the actual runtime source
of truth). Seed examples: `data/articles-index.json`,
`data/settings.example.json`. Do not let this section drift into a second
copy of those files.

## 7. Open Questions / Risks Carried Forward

(See the approved plan's "Risks and open design questions" for the full
original list. Restating the ones still live:)

- **Deployment target is still undecided.** If this is ever deployed to an
  ephemeral/serverless target with no persistent volume, every JSON/content
  file — including the encrypted AI key — is lost on redeploy/restart. Needs
  a decision before Phase 5 is treated as "done-done."
- **Concurrency safety is scoped to one Node process.** The write-queue +
  atomic-rename approach fully prevents lost updates/corruption within a
  single process, but does not help if this is ever horizontally scaled or
  run serverless with concurrent invocations. Don't scale beyond one instance
  without swapping to a real datastore first.
- **No self-serve admin password reset** (single owner, no email system) —
  accepted tradeoff; recovery is "regenerate `ADMIN_PASSWORD_HASH` /
  `SESSION_SECRET` and restart."
- Accessibility/contrast of the algorithmically-drifting palette needs actual
  visual QA across the hue range once the color engine exists (Phase 6).

## 8. How to Resume Work (for a new agent/person)

1. Read this file top to bottom, then skim `src/lib/storage/types.ts`.
2. `npm install && npm run dev`.
3. Check section 2 for the current phase and section 4 for the last completed
   checkpoint.
4. `git log --oneline -20` to correlate commits with the checklist in
   section 4.
5. Before writing Next.js-specific code, check
   `node_modules/next/dist/docs/` for the relevant guide — this project
   pins Next 16, which renamed Middleware to Proxy and introduced an opt-in
   Cache Components model; don't assume older Next.js conventions apply.

## 9. Glossary

- **Drift vector** — the long-term color pull computed from decayed category
  weights, combined via a weighted circular mean (hue is an angle, so this
  can't be a plain average).
- **Active influence** — how hard the *currently open* article's category
  pulls the palette for that one request, on top of the long-term drift.
- **Jitter** — the small per-visit random hue nudge that's computed fresh
  every render and never persisted — what keeps the site from ever looking
  perfectly static.
- **Lazy decay** — category weights aren't ticked down on a timer; each
  read computes "decay to right now" on the fly, and each write
  decays-then-adds-an-impulse for just the touched category.
- **Hero pool** — the small set of pre-generated hero-text variants
  (`data/hero-pool.json`) used instead of calling an AI provider on every
  single page load when live generation is enabled.
