/**
 * WCAG 2.x contrast, for warning about a Brand Kit that renders its own slides
 * unreadable. Pure and client-safe: the Brand Kit form checks as you type.
 */

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** sRGB companding, per the WCAG definition of relative luminance. */
function channel(component: number) {
  const c = component / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;

  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Null when either colour is not a 6-digit hex, so callers can stay quiet. */
export function contrastRatio(a: string, b: string): number | null {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  if (first === null || second === null) return null;

  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

/** AA for body text. Slide copy is large, but the footer and captions are not. */
export const readableContrast = 4.5;

export function isReadable(foreground: string, background: string) {
  const ratio = contrastRatio(foreground, background);
  return ratio === null || ratio >= readableContrast;
}
