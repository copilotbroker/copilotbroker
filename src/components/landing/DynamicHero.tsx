import { useEffect, useState } from "react";
import { LandingContent } from "@/types/project";
import { ChevronDown } from "lucide-react";

interface Props {
  content: LandingContent["hero"];
  theme: LandingContent["theme"];
}

export default function DynamicHero({ content, theme }: Props) {
  const [isVisible, setIsVisible] = useState(false);

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
        background: `linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.accentColor}ee 50%, ${theme.primaryColor}33 100%)`,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${theme.primaryColor}, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-8"
          style={{ background: `radial-gradient(circle, ${theme.primaryColor}, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <div
          className={`inline-block mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span
            className="px-5 py-2 rounded-full text-sm font-semibold tracking-wider uppercase border"
            style={{
              color: theme.primaryColor,
              borderColor: `${theme.primaryColor}66`,
              backgroundColor: `${theme.primaryColor}15`,
            }}
          >
            {content.badge}
          </span>
        </div>

        {/* Title */}
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ color: "#ffffff" }}
        >
          {content.title}
        </h1>

        {/* Subtitle */}
        <p
          className={`text-xl md:text-2xl mb-4 font-light transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ color: theme.primaryColor }}
        >
          {content.subtitle}
        </p>

        {/* Description */}
        <p
          className={`text-base md:text-lg max-w-2xl mx-auto mb-10 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {content.description}
        </p>

        {/* CTA Button */}
        <button
          onClick={scrollToForm}
          className={`px-10 py-4 rounded-full text-lg font-semibold transition-all duration-700 delay-500 hover:scale-105 hover:shadow-2xl ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.accentColor,
            boxShadow: `0 10px 40px ${theme.primaryColor}40`,
          }}
        >
          {content.ctaText}
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8" style={{ color: `${theme.primaryColor}80` }} />
      </div>
    </section>
  );
}
