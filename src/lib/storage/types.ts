export type ArticleFormat = "markdown" | "html";
export type ArticleStatus = "processing" | "published" | "failed";
export type ClassificationMethod = "ai" | "heuristic" | "manual";

export interface ArticleClassification {
  method: ClassificationMethod;
  confidence?: number;
  classifiedAt?: string;
  attempts?: number;
  error?: string;
}

export interface ArticleSpellcheckSummary {
  issueCount: number;
  checkedAt: string;
}

export interface ArticleMeta {
  id: string;
  slug: string;
  title: string;
  /** Admin-controlled "published" date, ISO 8601. Independent of createdAt. */
  date: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  format: ArticleFormat;
  /** Project-root-relative path to the raw source file, e.g. "content/articles/<id>.md" */
  sourcePath: string;
  /** Cached, sanitized excerpt HTML (first section, or full article if short). */
  excerpt: string;
  /** Whether the excerpt already covers the whole article (no "read more" needed). */
  excerptIsFull: boolean;
  status: ArticleStatus;
  classification?: ArticleClassification;
  spellcheck?: ArticleSpellcheckSummary;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface ArticlesIndex {
  version: 1;
  updatedAt: string;
  articles: ArticleMeta[];
}

export interface CategoryWeight {
  weight: number;
  lastEventAt: string;
}

export interface ColorTuning {
  halfLifeHours: number;
  driftIntensity: number;
  activeInfluence: number;
  jitterAmount: number;
}

export interface ColorBaseline {
  hue: number;
  saturation: number;
  lightness: number;
}

export interface ColorState {
  version: 1;
  updatedAt: string;
  baseline: ColorBaseline;
  categoryWeights: Record<string, CategoryWeight>;
  totalEvents: number;
  tuning: ColorTuning;
}

export type ActivityEventType = "preview_open" | "article_view";

export interface ActivityEvent {
  articleId: string;
  category: string;
  event: ActivityEventType;
  timestamp: string;
}

export type AIProviderKind = "anthropic" | "openai" | "gemini" | "custom";

export interface AISettings {
  provider: AIProviderKind;
  baseUrl: string;
  model: string;
  /** Encrypted at rest (see src/lib/ai/secret.ts). Null when no key has been set. */
  secret: string | null;
  liveGenerationEnabled: boolean;
  lastValidatedAt: string | null;
  lastError: string | null;
}

export interface PublicAISettings {
  provider: AIProviderKind;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
  liveGenerationEnabled: boolean;
  lastValidatedAt: string | null;
  lastError: string | null;
}

export interface BloggerSettings {
  name: string;
  bio: string;
  avatarUrl: string;
}

export interface TaxonomyCategory {
  key: string;
  label: string;
  hue: number;
  keywords: string[];
}

export interface Taxonomy {
  categories: TaxonomyCategory[];
}

export interface Settings {
  version: 1;
  updatedAt: string;
  blogger: BloggerSettings;
  ai: AISettings;
  heroTemplates: string[];
  taxonomy: Taxonomy;
  colorEngine: ColorTuning;
}

export interface PublicSettings {
  version: 1;
  updatedAt: string;
  blogger: BloggerSettings;
  ai: PublicAISettings;
  heroTemplates: string[];
  taxonomy: Taxonomy;
  colorEngine: ColorTuning;
}

export interface HeroPoolEntry {
  id: string;
  articleId: string | null;
  text: string;
  createdAt: string;
}

export interface HeroPool {
  version: 1;
  lastRefreshAt: string;
  entries: HeroPoolEntry[];
}

// ---- Store interfaces -------------------------------------------------
// Every other module talks to persisted state ONLY through these
// interfaces, never through raw fs calls. This is the seam that lets the
// storage backend move to a real database later without touching callers.

export interface ArticlesStore {
  list(): Promise<ArticleMeta[]>;
  getById(id: string): Promise<ArticleMeta | undefined>;
  getBySlug(slug: string): Promise<ArticleMeta | undefined>;
  create(meta: ArticleMeta, rawContent: string): Promise<ArticleMeta>;
  update(id: string, mutator: (a: ArticleMeta) => ArticleMeta): Promise<ArticleMeta>;
  getRawContent(article: ArticleMeta): Promise<string>;
  delete(id: string): Promise<void>;
}

export interface ColorStateStore {
  read(): Promise<ColorState>;
  recordEvent(category: string): Promise<ColorState>;
  updateTuning(tuning: Partial<ColorTuning>): Promise<ColorState>;
  reset(): Promise<ColorState>;
}

export interface ActivityLogStore {
  append(event: ActivityEvent): Promise<void>;
  readAll(): Promise<ActivityEvent[]>;
  exportCsv(): Promise<string>;
}

export interface SettingsStore {
  read(): Promise<Settings>;
  readPublic(): Promise<PublicSettings>;
  update(mutator: (s: Settings) => Settings): Promise<Settings>;
  /** Decrypts the stored API key, or null if unset/undecryptable. Server-only. */
  resolveApiKey(settings: Settings): string | null;
}
