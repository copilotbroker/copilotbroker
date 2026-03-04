import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "./iconMap";
import { AlertTriangle } from "lucide-react";

interface Props {
  content: LandingContent["urgency"];
  theme: LandingContent["theme"];
}

export default function DynamicUrgency({ content, theme }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Dynamic background based on theme style
  const bgColor = theme.style === "luxury"
    ? `${theme.accentColor}08`
    : theme.style === "nature"
    ? "#f0f7f0"
    : theme.style === "urban"
    ? "#f5f5f5"
    : "#fff8f0";

  return (
    <section ref={ref} className="py-20 md:py-28 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className={`text-3xl md:text-4xl font-bold mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          } ${theme.fontFamily === "serif" ? "font-serif italic" : ""}`}
          style={{ color: theme.accentColor }}
        >
          {content.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-5 rounded-xl bg-white border shadow-sm transition-all duration-500 hover:shadow-md ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${200 + i * 100}ms`,
                  borderColor: `${theme.primaryColor}25`,
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: theme.primaryColor }} />
                </div>
                <p className="text-sm text-gray-700 text-left font-medium">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div
          className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-700 delay-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{
            borderColor: theme.primaryColor,
            backgroundColor: `${theme.primaryColor}10`,
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
          <p className="text-sm font-semibold" style={{ color: theme.accentColor }}>
            {content.warning}
          </p>
        </div>
      </div>
    </section>
  );
}
