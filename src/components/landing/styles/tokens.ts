import { LandingContent, StylePalette, StyleTypography } from "@/types/project";

/**
 * Derive a complete 7-token palette from theme.palette OR from the
 * legacy primaryColor/accentColor pair (back-compat with old landings).
 */
export function getPalette(theme: LandingContent["theme"]): StylePalette {
  if (theme.palette) return theme.palette;
  const primary = theme.primaryColor || "#C9A961";
  const accent = theme.accentColor || "#0a0a0f";
  const family = theme.styleFamily;
  // Sensible defaults per family if no palette was returned
  if (family === "editorial") {
    return { bg: "#fafaf7", surface: "#ffffff", primary, primaryFg: "#ffffff", muted: "#6b6b66", accent: "#111111", border: "#e6e3dc" };
  }
  if (family === "luxury-noir") {
    return { bg: "#08080a", surface: "#101014", primary, primaryFg: "#0a0a0f", muted: "#a09887", accent: "#1a1814", border: "#2a2620" };
  }
  if (family === "modern-glass") {
    return { bg: "#0a0a1a", surface: "#141432", primary, primaryFg: "#ffffff", muted: "#94a3b8", accent, border: "#26264a" };
  }
  if (family === "nature-organic") {
    return { bg: "#f5f0e8", surface: "#ffffff", primary, primaryFg: "#ffffff", muted: "#6b6258", accent: "#2d3b2a", border: "#dcd5c7" };
  }
  // Generic fallback
  return { bg: accent, surface: `${accent}f0`, primary, primaryFg: "#ffffff", muted: `${accent}99`, accent, border: `${primary}30` };
}

export function getTypography(theme: LandingContent["theme"]): StyleTypography {
  if (theme.typography) return theme.typography;
  const family = theme.styleFamily;
  if (family === "editorial") return { display: "Fraunces", body: "Inter", displayWeight: 600, bodyWeight: 400 };
  if (family === "luxury-noir") return { display: "Cormorant Garamond", body: "Manrope", displayWeight: 500, bodyWeight: 300 };
  if (family === "modern-glass") return { display: "Space Grotesk", body: "DM Sans", displayWeight: 700, bodyWeight: 400 };
  if (family === "nature-organic") return { display: "Lora", body: "Nunito Sans", displayWeight: 500, bodyWeight: 400 };
  return { display: theme.fontFamily === "serif" ? "Cormorant Garamond" : "Inter", body: "Inter" };
}
