export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const safe = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

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

export function getReadableTextColor(backgroundHex: string, lightColor = "#F8FAFC", darkColor = "#0F172A") {
  return isLightColor(backgroundHex) ? darkColor : lightColor;
}

export function getMutedTextColor(backgroundHex: string) {
  return isLightColor(backgroundHex) ? "rgba(15,23,42,0.78)" : "rgba(248,250,252,0.82)";
}

export function getSoftSurface(backgroundHex: string) {
  return isLightColor(backgroundHex) ? "rgba(255,255,255,0.82)" : "rgba(15,23,42,0.22)";
}

export function getSoftBorder(backgroundHex: string) {
  return isLightColor(backgroundHex) ? "rgba(15,23,42,0.12)" : "rgba(248,250,252,0.16)";
}
