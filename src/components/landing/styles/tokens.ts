import { LandingContent, StylePalette, StyleTypography } from "@/types/project";

/**
 * Derive a complete 7-token palette from theme.palette OR from the
 * legacy primaryColor/accentColor pair (back-compat with old landings).
 */
export function getPalette(theme: LandingContent["theme"]): StylePalette {
  if (theme.palette) return theme.palette;
  const family = theme.styleFamily;
  // Para luxury-noir e fallback genérico, IGNORAMOS o primaryColor legado
  // (que costuma ser amarelo neon do tema da plataforma) e forçamos um
  // dourado quente que combina com o visual cinematográfico.
  if (family === "editorial") {
    const primary = theme.primaryColor || "#111111";
    return { bg: "#fafaf7", surface: "#ffffff", primary, primaryFg: "#ffffff", muted: "#6b6b66", accent: "#111111", border: "#e6e3dc" };
  }
  if (family === "modern-glass") {
    const primary = theme.primaryColor || "#4f46e5";
    return { bg: "#0a0a1a", surface: "#141432", primary, primaryFg: "#ffffff", muted: "#94a3b8", accent: theme.accentColor || "#1a1a3a", border: "#26264a" };
  }
  if (family === "nature-organic") {
    const primary = theme.primaryColor || "#8b7355";
    return { bg: "#f5f0e8", surface: "#ffffff", primary, primaryFg: "#ffffff", muted: "#6b6258", accent: "#2d3b2a", border: "#dcd5c7" };
  }
  // luxury-noir + fallback padrão: dourado quente sobre preto profundo.
  return { bg: "#0a0a0f", surface: "#141418", primary: "#d4af37", primaryFg: "#0a0a0f", muted: "#a09887", accent: "#1a1814", border: "#2a2620" };
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
