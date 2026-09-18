// Category -> hue mapping. The admin's taxonomy settings (settings.taxonomy
// categories[].hue) take priority when present; this table is the fallback
// for the seed taxonomy and any category not found there, and the hash
// keeps things deterministic and stable across restarts for anything
// neither knows about.
export const CATEGORY_HUE_TABLE: Record<string, number> = {
  technology: 210,
  programming: 205,
  travel: 35,
  food: 25,
  cooking: 20,
  health: 145,
  fitness: 150,
  personal: 280,
  life: 285,
  business: 0,
  finance: 5,
  culture: 320,
  art: 300,
  music: 260,
  science: 190,
  books: 95,
  writing: 90,
  politics: 350,
  opinion: 345,
  uncategorized: 220,
};

export function hashHue(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

/**
 * Resolves a category to a hue (0-360). `overrides` is normally
 * settings.taxonomy.categories, checked before the built-in table, before
 * finally falling back to a deterministic hash so nothing is ever colorless.
 */
export function hueForCategory(category: string, overrides?: Record<string, number>): number {
  const key = category.trim().toLowerCase();
  if (overrides && key in overrides) return overrides[key];
  if (key in CATEGORY_HUE_TABLE) return CATEGORY_HUE_TABLE[key];
  return hashHue(key);
}

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Shortest-arc lerp between two hues, correctly handling the 360°/0° wrap. */
export function circularLerp(a: number, b: number, t: number): number {
  const diff = (((b - a + 540) % 360) + 360) % 360 - 180;
  return normalizeDeg(a + diff * t);
}
