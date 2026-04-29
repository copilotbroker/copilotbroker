import { useEffect, useState } from "react";
import { LandingContent } from "@/types/project";
import { ChevronDown } from "lucide-react";
import { getMutedTextColor, getReadableTextColor, getSoftSurface, isLightColor } from "@/lib/landing-theme";

interface Props {
  content: LandingContent["hero"];
  theme: LandingContent["theme"];
}

export default function DynamicHero({ content, theme }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const isSerif = theme.fontFamily === "serif";
  const hasBg = !!content.backgroundImageUrl;
  const isSplit = content.layout === "split";
  const accentIsLight = isLightColor(theme.accentColor);
  // When a background image is present we render text over a dark photo overlay,
  // so text MUST be light regardless of the accent color of the theme.
  const heroTextColor = hasBg ? "#F8FAFC" : getReadableTextColor(theme.accentColor);
  const heroMutedColor = hasBg ? "rgba(248,250,252,0.88)" : getMutedTextColor(theme.accentColor);
  const badgeSurface = hasBg ? "rgba(15,23,42,0.45)" : getSoftSurface(theme.accentColor);
  const buttonTextColor = getReadableTextColor(theme.primaryColor, "#F8FAFC", "#0F172A");

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollToForm = () => {
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: hasBg
          ? undefined
          : `linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.accentColor}f2 60%, ${theme.primaryColor}2b 100%)`,
      }}
    >
      {hasBg && (
        <>
          <img
            src={content.backgroundImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: accentIsLight
                ? "linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.52) 45%, rgba(15,23,42,0.38) 100%)"
                : `linear-gradient(135deg, ${theme.accentColor}d9 0%, ${theme.accentColor}c9 50%, rgba(15,23,42,0.42) 100%)`,
            }}
          />
        </>
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${theme.primaryColor}, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08]"
          style={{ background: `radial-gradient(circle, ${theme.primaryColor}, transparent 70%)` }}
        />
      </div>

      <div className={`relative z-10 w-full max-w-6xl mx-auto px-4 ${isSplit ? "flex flex-col lg:flex-row items-center gap-8 lg:gap-12" : "text-center"}`}>
        <div className={isSplit ? "flex-1" : ""}>
          <div
            className={`inline-block mb-4 md:mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span
              className="px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-semibold tracking-wider uppercase border"
              style={{
                color: heroTextColor,
                borderColor: `${theme.primaryColor}55`,
                backgroundColor: badgeSurface,
              }}
            >
              {content.badge}
            </span>
          </div>

          <h1
            className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            } ${isSerif ? "font-serif italic" : ""}`}
            style={{ color: heroTextColor }}
          >
            {content.title}
          </h1>

          <p
            className={`text-lg sm:text-xl md:text-2xl mb-3 md:mb-4 font-light transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            } ${isSerif ? "font-serif" : ""}`}
            style={{ color: accentIsLight ? "rgba(248,250,252,0.92)" : theme.primaryColor }}
          >
            {content.subtitle}
          </p>

          <p
            className={`text-sm sm:text-base md:text-lg max-w-2xl ${isSplit ? "" : "mx-auto"} mb-6 md:mb-10 transition-all duration-700 delay-[400ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ color: heroMutedColor }}
          >
            {content.description}
          </p>

          <button
            onClick={scrollToForm}
            className={`px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg font-semibold transition-all duration-700 delay-500 hover:scale-105 hover:shadow-2xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              backgroundColor: theme.primaryColor,
              color: buttonTextColor,
              boxShadow: `0 10px 40px ${theme.primaryColor}40`,
            }}
          >
            {content.ctaText}
          </button>
        </div>

        {isSplit && (
          <div
            className={`flex-1 hidden lg:block transition-all duration-1000 delay-500 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div
              className="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}25, ${theme.primaryColor}08)`,
                border: `1px solid ${theme.primaryColor}20`,
              }}
            >
              {content.backgroundImageUrl && (
                <img
                  src={content.backgroundImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8" style={{ color: `${heroTextColor}cc` }} />
      </div>
    </section>
  );
}
