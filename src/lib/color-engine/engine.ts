import { colorStateStore, decayedWeight } from "../storage/color-state-store";
import { settingsStore } from "../storage/settings-store";
import type { ColorState, ColorTuning } from "../storage/types";
import { hueForCategory, normalizeDeg, clamp, clamp01, lerp, circularLerp } from "./palette";
import { deriveCssVars, type ComputedTheme } from "./css-vars";

export interface ActivePreview {
  category: string;
}

export interface ComputeThemeInput {
  state: ColorState;
  activePreview?: ActivePreview | null;
  categoryHueOverrides?: Record<string, number>;
  /** ms epoch; defaults to Date.now(). Exposed for deterministic tests. */
  now?: number;
  /** Skip the per-visit random jitter; exposed for deterministic tests. */
  skipJitter?: boolean;
}

export interface DriftResult {
  /** Baseline hue already blended toward the long-term drift. */
  hue: number;
  /** How far this pulled from baseline (0-1) -- reused for the saturation lerp too. */
  driftAmount: number;
}

/**
 * The long-term drift component only: a weighted circular mean of every
 * category's decayed weight (hue is an angle, so this has to be vector
 * math, not a plain average -- averaging 350 deg and 10 deg must land
 * near 0 deg, not 180), blended toward baseline by confidence. Factored
 * out of computeTheme() so the stats page can replay this same math
 * against the activity log to reconstruct a historical hue timeline,
 * without duplicating the vector-math logic.
 */
export function computeDrift(
  categoryWeights: ColorState["categoryWeights"],
  tuning: ColorTuning,
  baselineHue: number,
  now: number,
  categoryHueOverrides?: Record<string, number>
): DriftResult {
  let vx = 0;
  let vy = 0;
  let totalWeight = 0;
  for (const [category, entry] of Object.entries(categoryWeights)) {
    const decayed = decayedWeight(entry, tuning.halfLifeHours, now);
    if (decayed < 0.01) continue; // prune negligible contributors
    const hue = hueForCategory(category, categoryHueOverrides);
    const rad = (hue * Math.PI) / 180;
    vx += decayed * Math.cos(rad);
    vy += decayed * Math.sin(rad);
    totalWeight += decayed;
  }

  // Magnitude ~1 = recent activity concentrated in one category (confident
  // pull). Magnitude ~0 = spread across many categories, or no activity at
  // all (fall back toward baseline).
  const magnitude = totalWeight > 0 ? Math.min(1, Math.hypot(vx, vy) / totalWeight) : 0;
  const driftHue = totalWeight > 0 ? normalizeDeg((Math.atan2(vy, vx) * 180) / Math.PI) : baselineHue;
  const driftAmount = clamp01(magnitude * tuning.driftIntensity);

  return { hue: circularLerp(baselineHue, driftHue, driftAmount), driftAmount };
}

/**
 * The living color engine's read path. Blend order is deliberate:
 * baseline -> long-term drift (confidence-weighted) -> active-preview pull
 * (this request only) -> random jitter (this request only, never
 * persisted). See /context.md for the full rationale.
 */
export function computeTheme(input: ComputeThemeInput): ComputedTheme {
  const { state, activePreview, categoryHueOverrides, now = Date.now(), skipJitter = false } = input;

  const drift = computeDrift(state.categoryWeights, state.tuning, state.baseline.hue, now, categoryHueOverrides);
  let hue = drift.hue;
  let saturation = lerp(state.baseline.saturation, Math.min(100, state.baseline.saturation + 15), drift.driftAmount);
  const lightness = clamp(state.baseline.lightness, 30, 60);

  if (activePreview) {
    const previewHue = hueForCategory(activePreview.category, categoryHueOverrides);
    hue = circularLerp(hue, previewHue, state.tuning.activeInfluence);
  }

  if (!skipJitter) {
    const jitter = (Math.random() * 2 - 1) * state.tuning.jitterAmount;
    hue = normalizeDeg(hue + jitter);
  }

  saturation = clamp(saturation, 25, 70);

  return {
    hue,
    saturation,
    lightness,
    cssVars: deriveCssVars(hue, saturation, lightness),
  };
}

/** Convenience wrapper: reads current state + taxonomy hue overrides, then computes. */
export async function computeCurrentTheme(activePreview?: ActivePreview | null): Promise<ComputedTheme> {
  const [state, settings] = await Promise.all([colorStateStore.read(), settingsStore.read()]);
  const categoryHueOverrides = Object.fromEntries(settings.taxonomy.categories.map((c) => [c.key, c.hue]));
  return computeTheme({ state, activePreview, categoryHueOverrides });
}
