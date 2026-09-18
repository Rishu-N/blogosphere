import { COLOR_STATE_PATH } from "./paths";
import { readValidatedJsonFile, updateJsonFile } from "./json-file-store";
import { ColorStateSchema } from "../validation/schemas";
import type { ColorState, ColorStateStore, ColorTuning } from "./types";

export const DEFAULT_TUNING: ColorTuning = {
  halfLifeHours: 72,
  driftIntensity: 0.6,
  activeInfluence: 0.5,
  jitterAmount: 6,
};

export const DEFAULT_COLOR_STATE: ColorState = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  baseline: { hue: 210, saturation: 40, lightness: 45 },
  categoryWeights: {},
  totalEvents: 0,
  tuning: DEFAULT_TUNING,
};

/**
 * Decays a stored category weight forward to `nowMs`. Shared by the write
 * path (recordEvent, decays just the touched category) and the color
 * engine's read path (decays every category to "now" when rendering).
 */
export function decayedWeight(entry: { weight: number; lastEventAt: string }, halfLifeHours: number, nowMs: number): number {
  const halfLifeMs = halfLifeHours * 3_600_000;
  const elapsedMs = Math.max(0, nowMs - Date.parse(entry.lastEventAt));
  return entry.weight * Math.pow(0.5, elapsedMs / halfLifeMs);
}

export const colorStateStore: ColorStateStore = {
  async read() {
    return readValidatedJsonFile(COLOR_STATE_PATH, ColorStateSchema, DEFAULT_COLOR_STATE, "color-state.json");
  },

  async recordEvent(category) {
    return updateJsonFile(COLOR_STATE_PATH, DEFAULT_COLOR_STATE, (state) => {
      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const existing = state.categoryWeights[category];
      const decayed = existing ? decayedWeight(existing, state.tuning.halfLifeHours, now) : 0;
      state.categoryWeights[category] = { weight: decayed + 1, lastEventAt: nowIso };
      state.totalEvents += 1;
      state.updatedAt = nowIso;
      return state;
    });
  },

  async updateTuning(tuning) {
    return updateJsonFile(COLOR_STATE_PATH, DEFAULT_COLOR_STATE, (state) => {
      state.tuning = { ...state.tuning, ...tuning };
      state.updatedAt = new Date().toISOString();
      return state;
    });
  },

  async reset() {
    return updateJsonFile(COLOR_STATE_PATH, DEFAULT_COLOR_STATE, (state) => ({
      ...DEFAULT_COLOR_STATE,
      tuning: state.tuning,
      updatedAt: new Date().toISOString(),
    }));
  },
};
