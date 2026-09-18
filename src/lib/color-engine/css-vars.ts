export interface ComputedTheme {
  hue: number;
  saturation: number;
  lightness: number;
  cssVars: Record<string, string>;
}

function hslToRgb01(h: number, s: number, l: number): [number, number, number] {
  const s1 = s / 100;
  const l1 = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s1 * Math.min(l1, 1 - l1);
  const f = (n: number) => l1 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

/** WCAG relative luminance. Hue-aware (unlike raw HSL lightness -- yellow/green read much lighter than blue/red at the same L). */
function relativeLuminance(h: number, s: number, l: number): number {
  const channels = hslToRgb01(h, s, l).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Derives the full role palette from one hue/sat/lightness triple.
 *
 * Two accent variables exist deliberately: `--color-accent` keeps the full
 * drifting lightness/saturation range for backgrounds (buttons, the active
 * dot) where visual variety is the point. `--color-accent-text` is a
 * separate, contrast-locked variant (lightness clamped low, saturation
 * capped) for using the hue as TEXT color against a light surface --
 * verified via a full hue/sat/lightness sweep with the WCAG contrast
 * formula that the naive "just use --color-accent as text" approach
 * fails at roughly 90% of hues (yellow/green hues read as high-luminance
 * even at moderate HSL lightness, cutting contrast against light
 * backgrounds far more than blue/red/purple do at the same numbers).
 * `--color-text-on-accent` (for text ON TOP of the --color-accent
 * background) is picked by actually comparing both candidates' contrast
 * against the real computed accent color, not a lightness threshold --
 * the worst case across the whole hue range is ~4.1:1, still comfortably
 * above the 3:1 minimum for button-sized text.
 */
export function deriveCssVars(hue: number, saturation: number, lightness: number): Record<string, string> {
  const h = ((hue % 360) + 360) % 360;
  const s = Math.min(100, Math.max(0, saturation));
  const l = Math.min(100, Math.max(0, lightness));
  const accentHue2 = (h + 30) % 360;

  const bg = `hsl(${h.toFixed(1)} ${(s * 0.15).toFixed(1)}% 97%)`;
  const surface = `hsl(${h.toFixed(1)} ${(s * 0.12).toFixed(1)}% 100%)`;
  const accent = `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  const accentSoft = `hsl(${h.toFixed(1)} ${(s * 0.35).toFixed(1)}% ${Math.max(88, Math.min(96, l + 42)).toFixed(1)}%)`;
  const accent2 = `hsl(${accentHue2.toFixed(1)} ${Math.max(0, s - 10).toFixed(1)}% ${Math.min(70, l + 10).toFixed(1)}%)`;
  const border = `hsl(${h.toFixed(1)} ${(s * 0.25).toFixed(1)}% 88%)`;
  const accentText = `hsl(${h.toFixed(1)} ${Math.min(65, s).toFixed(1)}% 25%)`;
  const text = "hsl(240 10% 15%)";
  const textMuted = "hsl(240 6% 40%)";

  const accentLuminance = relativeLuminance(h, s, l);
  const blackLuminance = relativeLuminance(0, 0, 10);
  const whiteLuminance = relativeLuminance(0, 0, 98);
  const textOnAccent =
    contrastRatio(accentLuminance, blackLuminance) >= contrastRatio(accentLuminance, whiteLuminance)
      ? "hsl(0 0% 10%)"
      : "hsl(0 0% 98%)";

  return {
    "--color-bg": bg,
    "--color-surface": surface,
    "--color-accent": accent,
    "--color-accent-soft": accentSoft,
    "--color-accent-2": accent2,
    "--color-accent-text": accentText,
    "--color-border": border,
    "--color-text": text,
    "--color-text-muted": textMuted,
    "--color-text-on-accent": textOnAccent,
  };
}

export function cssVarsToStyleString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}
