import { ComponentType } from "react";
import { LandingContent, StyleFamily } from "@/types/project";
import * as Editorial from "./editorial";
import * as LuxuryNoir from "./luxury-noir";
import * as ModernGlass from "./modern-glass";
import * as NatureOrganic from "./nature-organic";

export interface StyleFamilyModule {
  Hero: ComponentType<{ content: LandingContent["hero"]; theme: LandingContent["theme"] }>;
  About: ComponentType<{ content: LandingContent["about"]; theme: LandingContent["theme"] }>;
  Features: ComponentType<{ content: LandingContent["features"]; theme: LandingContent["theme"] }>;
  Urgency: ComponentType<{ content: LandingContent["urgency"]; theme: LandingContent["theme"] }>;
  Benefits: ComponentType<{ content: LandingContent["benefits"]; theme: LandingContent["theme"] }>;
  CTA: ComponentType<{ content: LandingContent["cta"]; theme: LandingContent["theme"] }>;
  Footer: ComponentType<{ content: LandingContent["footer"]; theme: LandingContent["theme"] }>;
}

export const STYLE_REGISTRY: Record<StyleFamily, StyleFamilyModule> = {
  editorial: Editorial,
  "luxury-noir": LuxuryNoir,
  "modern-glass": ModernGlass,
  "nature-organic": NatureOrganic,
};

export function getStyleFamily(family?: StyleFamily): StyleFamilyModule | null {
  if (!family) return null;
  return STYLE_REGISTRY[family] || null;
}
