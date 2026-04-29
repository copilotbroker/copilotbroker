// Utilities to compute readable text colors over arbitrary background hex
// values. Accepts 3-, 6- and 8-digit hex (alpha channel is ignored for
// luminance — alpha is opacity over a parent surface, not a color shift).

export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();

  // Strip alpha if present (8 chars = RRGGBBAA, 4 chars = RGBA)
  let core = normalized;
  if (core.length === 8) core = core.slice(0, 6);
  else if (core.length === 4) core = core.slice(0, 3);

  const safe = core.length === 3
    ? core.split("").map((char) => char + char).join("")
    : core;

  if (safe.length !== 6) {
    return { r: 17, g: 24, b: 39 };
  }

  const value = Number.parseInt(safe, 16);

  if (Number.isNaN(value)) {
    return { r: 17, g: 24, b: 39 };
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isLightColor(hex: string) {
  return getRelativeLuminance(hex) > 0.6;
}

/**
 * Returns the alpha channel (0–1) when the hex includes one, or 1 otherwise.
 */
function getAlpha(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length === 8) {
    const a = Number.parseInt(normalized.slice(6, 8), 16);
    return Number.isNaN(a) ? 1 : a / 255;
  }
  if (normalized.length === 4) {
    const a = Number.parseInt(normalized.slice(3, 4).repeat(2), 16);
    return Number.isNaN(a) ? 1 : a / 255;
  }
  return 1;
}

/**
 * Compute the *effective* background color when a translucent hex sits on top
 * of a parent surface. The landing pages render on a near-black app shell
 * (forced dark theme), so a tint like `#3B82F60d` (5% opacity) is effectively
 * dark — and text on it must be light, not dark.
 */
function getEffectiveBackground(hex: string, parentHex = "#0a0a0f") {
  const alpha = getAlpha(hex);
  if (alpha >= 0.98) return hex;
  const fg = hexToRgb(hex);
  const bg = hexToRgb(parentHex);
  const r = Math.round(fg.r * alpha + bg.r * (1 - alpha));
  const g = Math.round(fg.g * alpha + bg.g * (1 - alpha));
  const b = Math.round(fg.b * alpha + bg.b * (1 - alpha));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getReadableTextColor(backgroundHex: string, lightColor = "#F8FAFC", darkColor = "#0F172A") {
  const effective = getEffectiveBackground(backgroundHex);
  return isLightColor(effective) ? darkColor : lightColor;
}

export function getMutedTextColor(backgroundHex: string) {
  const effective = getEffectiveBackground(backgroundHex);
  return isLightColor(effective) ? "rgba(15,23,42,0.78)" : "rgba(248,250,252,0.82)";
}

export function getSoftSurface(backgroundHex: string) {
  const effective = getEffectiveBackground(backgroundHex);
  return isLightColor(effective) ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.06)";
}

export function getSoftBorder(backgroundHex: string) {
  const effective = getEffectiveBackground(backgroundHex);
  return isLightColor(effective) ? "rgba(15,23,42,0.12)" : "rgba(248,250,252,0.16)";
}
