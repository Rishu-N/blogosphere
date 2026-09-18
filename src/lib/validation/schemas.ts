import { z } from "zod";

export const ArticleFormatSchema = z.enum(["markdown", "html"]);
export const ArticleStatusSchema = z.enum(["processing", "published", "failed"]);
export const ClassificationMethodSchema = z.enum(["ai", "heuristic", "manual"]);

export const ArticleClassificationSchema = z.object({
  method: ClassificationMethodSchema,
  confidence: z.number().min(0).max(1).optional(),
  classifiedAt: z.string().optional(),
  attempts: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export const ArticleSpellcheckSummarySchema = z.object({
  issueCount: z.number().int().min(0),
  checkedAt: z.string(),
});

export const ArticleMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  format: ArticleFormatSchema,
  sourcePath: z.string(),
  excerpt: z.string(),
  excerptIsFull: z.boolean(),
  status: ArticleStatusSchema,
  classification: ArticleClassificationSchema.optional(),
  spellcheck: ArticleSpellcheckSummarySchema.optional(),
  wordCount: z.number().int().min(0),
  readingTimeMinutes: z.number().min(0),
});

export const ArticlesIndexSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  articles: z.array(ArticleMetaSchema),
});

export const CategoryWeightSchema = z.object({
  weight: z.number(),
  lastEventAt: z.string(),
});

export const ColorTuningSchema = z.object({
  halfLifeHours: z.number().positive(),
  driftIntensity: z.number().min(0).max(1),
  activeInfluence: z.number().min(0).max(1),
  jitterAmount: z.number().min(0),
});

export const ColorStateSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  baseline: z.object({
    hue: z.number(),
    saturation: z.number(),
    lightness: z.number(),
  }),
  categoryWeights: z.record(z.string(), CategoryWeightSchema),
  totalEvents: z.number().int().min(0),
  tuning: ColorTuningSchema,
});

export const ActivityEventSchema = z.object({
  articleId: z.string(),
  category: z.string(),
  event: z.enum(["preview_open", "article_view"]),
  timestamp: z.string(),
});

export const AIProviderKindSchema = z.enum(["anthropic", "openai", "gemini", "custom"]);

export const AISettingsSchema = z.object({
  provider: AIProviderKindSchema,
  baseUrl: z.string(),
  model: z.string(),
  secret: z.string().nullable(),
  liveGenerationEnabled: z.boolean(),
  lastValidatedAt: z.string().nullable(),
  lastError: z.string().nullable(),
});

export const TaxonomyCategorySchema = z.object({
  key: z.string(),
  label: z.string(),
  hue: z.number().min(0).max(360),
  keywords: z.array(z.string()),
});

export const SettingsSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  blogger: z.object({
    name: z.string(),
    bio: z.string(),
    avatarUrl: z.string(),
  }),
  ai: AISettingsSchema,
  heroTemplates: z.array(z.string()),
  taxonomy: z.object({ categories: z.array(TaxonomyCategorySchema) }),
  colorEngine: ColorTuningSchema,
});

export const HeroPoolEntrySchema = z.object({
  id: z.string(),
  articleId: z.string().nullable(),
  text: z.string(),
  createdAt: z.string(),
});

export const HeroPoolSchema = z.object({
  version: z.literal(1),
  lastRefreshAt: z.string(),
  entries: z.array(HeroPoolEntrySchema),
});
