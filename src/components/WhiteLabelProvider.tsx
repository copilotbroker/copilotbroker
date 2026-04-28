// White-label runtime: applies the active organization's branding (primary color,
// document title and favicon) to the current document. Mounted globally inside
// OrganizationProvider so it follows org switches automatically.
//
// Skipped on landing pages and master panel routes — those keep the original
// product branding (Enove launches / Copilot Broker master).
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useOrgContext } from "@/contexts/OrganizationContext";

// Convert "#rrggbb" or "rgb(r,g,b)" to "h s% l%" string usable by Tailwind tokens.
function colorToHsl(input: string | null | undefined): string | null {
  if (!input) return null;
  let r = 0, g = 0, b = 0;
  const hex = input.trim();
  if (hex.startsWith("#")) {
    const v = hex.slice(1);
    if (v.length === 3) {
      r = parseInt(v[0] + v[0], 16);
      g = parseInt(v[1] + v[1], 16);
      b = parseInt(v[2] + v[2], 16);
    } else if (v.length === 6) {
      r = parseInt(v.slice(0, 2), 16);
      g = parseInt(v.slice(2, 4), 16);
      b = parseInt(v.slice(4, 6), 16);
    } else {
      return null;
    }
  } else {
    const m = hex.match(/rgb\((\d+)\D+(\d+)\D+(\d+)/i);
    if (!m) return null;
    r = +m[1]; g = +m[2]; b = +m[3];
  }

  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const PROTECTED_PREFIXES = [
  "/master",       // master panel always shows Copilot Broker brand
  "/auth",
  "/convite",
];

const isLandingPage = (pathname: string) => {
  // App admin/broker areas use these prefixes; everything else is treated as a public landing.
  return !(
    pathname.startsWith("/admin") ||
    pathname.startsWith("/corretor") ||
    pathname.startsWith("/master") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/convite") ||
    pathname.startsWith("/google-calendar") ||
    pathname.startsWith("/designsystem")
  );
};

export const WhiteLabelProvider = () => {
  const { activeOrg } = useOrgContext();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!activeOrg) return;
    if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    if (isLandingPage(pathname)) return;

    const root = document.documentElement;
    const previous: Record<string, string> = {
      primary: root.style.getPropertyValue("--primary"),
      ring: root.style.getPropertyValue("--ring"),
      accent: root.style.getPropertyValue("--accent"),
    };

    const primaryHsl = colorToHsl(activeOrg.primary_color);
    if (primaryHsl) {
      root.style.setProperty("--primary", primaryHsl);
      root.style.setProperty("--ring", primaryHsl);
      root.style.setProperty("--accent", primaryHsl);
    }

    const previousTitle = document.title;
    const displayName = activeOrg.display_name || activeOrg.name;
    document.title = displayName;

    let faviconChanged = false;
    let previousFaviconHref: string | null = null;
    let faviconEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (activeOrg.favicon_url) {
      if (!faviconEl) {
        faviconEl = document.createElement("link");
        faviconEl.rel = "icon";
        document.head.appendChild(faviconEl);
      }
      previousFaviconHref = faviconEl.href;
      faviconEl.href = activeOrg.favicon_url;
      faviconChanged = true;
    }

    return () => {
      root.style.setProperty("--primary", previous.primary);
      root.style.setProperty("--ring", previous.ring);
      root.style.setProperty("--accent", previous.accent);
      document.title = previousTitle;
      if (faviconChanged && faviconEl && previousFaviconHref !== null) {
        faviconEl.href = previousFaviconHref;
      }
    };
  }, [activeOrg, pathname]);

  return null;
};
