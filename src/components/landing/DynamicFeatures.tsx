import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "./iconMap";

interface Props {
  content: LandingContent["features"];
  theme: LandingContent["theme"];
}

export default function DynamicFeatures({ content, theme }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-28 px-4" style={{ backgroundColor: theme.accentColor }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className={`text-3xl md:text-4xl font-bold mb-14 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ color: "#ffffff" }}
        >
          {content.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={i}
                className={`group p-6 rounded-2xl border transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  borderColor: `${theme.primaryColor}20`,
                  backgroundColor: `${theme.primaryColor}08`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${theme.primaryColor}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: theme.primaryColor }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
