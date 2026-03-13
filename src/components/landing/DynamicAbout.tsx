import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "./iconMap";

interface Props {
  content: LandingContent["about"];
  theme: LandingContent["theme"];
}

export default function DynamicAbout({ content, theme }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isSerif = theme.fontFamily === "serif";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id="sobre" className="py-14 md:py-28 px-4" style={{ backgroundColor: "#fafafa" }}>
      <div className="max-w-5xl mx-auto">
        <div
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center ${isSerif ? "font-serif italic" : ""}`}
            style={{ color: theme.accentColor }}
          >
            {content.title}
          </h2>

          <div className="space-y-4 mb-12 max-w-3xl mx-auto">
            {content.paragraphs.map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed text-gray-600">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ backgroundColor: `${theme.primaryColor}20` }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
          <div className="flex-1 h-px" style={{ backgroundColor: `${theme.primaryColor}20` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.highlights.map((h, i) => {
            const Icon = getIcon(h.icon);
            return (
              <div
                key={i}
                className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-500 hover:shadow-lg ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${300 + i * 100}ms`,
                  borderColor: `${theme.primaryColor}20`,
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: theme.primaryColor }} />
                </div>
                <p className="text-sm text-gray-700 font-medium">{h.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
