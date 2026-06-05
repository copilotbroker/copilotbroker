import { useEffect } from "react";

interface Props {
  fonts: string[]; // e.g. ["Fraunces", "Inter"]
}

/**
 * Dynamically injects Google Fonts <link> tags so each landing page
 * can use a unique typographic pair without bundling every font.
 */
export default function FontLoader({ fonts }: Props) {
  useEffect(() => {
    if (!fonts || fonts.length === 0) return;

    const unique = Array.from(new Set(fonts.filter(Boolean)));
    const families = unique
      .map((f) => `family=${encodeURIComponent(f.trim()).replace(/%20/g, "+")}:wght@300;400;500;600;700;800;900`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;

    const id = `font-loader-${unique.join("-").replace(/\s+/g, "")}`;
    if (document.getElementById(id)) return;

    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;

    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(link);
  }, [fonts]);

  return null;
}
