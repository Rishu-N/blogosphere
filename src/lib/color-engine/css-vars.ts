export interface ComputedTheme {
  hue: number;
  saturation: number;
  lightness: number;
  cssVars: Record<string, string>;
}

/**
 * Derives the full role palette from one hue/sat/lightness triple. Text
 * color is picked for contrast against the surface, not locked to the hue,
 * so readability never depends on where the drift happens to be.
 */
export function deriveCssVars(hue: number, saturation: number, lightness: number): Record<string, string> {
  const h = ((hue % 360) + 360) % 360;
  const s = Math.min(100, Math.max(0, saturation));
  const l = Math.min(100, Math.max(0, lightness));
  const accentHue2 = (h + 30) % 360;

  const bg = `hsl(${h.toFixed(1)} ${(s * 0.15).toFixed(1)}% 97%)`;
  const surface = `hsl(${h.toFixed(1)} ${(s * 0.12).toFixed(1)}% 100%)`;
  const accent = `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  const accentSoft = `hsl(${h.toFixed(1)} ${(s * 0.35).toFixed(1)}% ${Math.min(96, l + 42).toFixed(1)}%)`;
  const accent2 = `hsl(${accentHue2.toFixed(1)} ${Math.max(0, s - 10).toFixed(1)}% ${Math.min(70, l + 10).toFixed(1)}%)`;
  const border = `hsl(${h.toFixed(1)} ${(s * 0.25).toFixed(1)}% 88%)`;
  const textOnAccent = l > 55 ? "hsl(0 0% 10%)" : "hsl(0 0% 98%)";
  const text = "hsl(240 10% 15%)";
  const textMuted = "hsl(240 6% 40%)";

  return {
    "--color-bg": bg,
    "--color-surface": surface,
    "--color-accent": accent,
    "--color-accent-soft": accentSoft,
    "--color-accent-2": accent2,
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
