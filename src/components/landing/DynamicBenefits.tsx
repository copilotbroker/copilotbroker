import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "./iconMap";
import { getMutedTextColor, getReadableTextColor, getSoftBorder, getSoftSurface } from "@/lib/landing-theme";

interface Props {
  content: LandingContent["benefits"];
  theme: LandingContent["theme"];
}

export default function DynamicBenefits({ content, theme }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isSerif = theme.fontFamily === "serif";
  const sectionBg = "#ffffff";
  const headingColor = getReadableTextColor(sectionBg);
  const bodyColor = getMutedTextColor(sectionBg);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-14 md:py-28 px-4" style={{ backgroundColor: sectionBg }}>
      <div className="max-w-5xl mx-auto">
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-14 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          } ${isSerif ? "font-serif italic" : ""}`}
          style={{ color: headingColor }}
        >
          {content.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={i}
                className={`flex items-start gap-4 p-6 rounded-2xl border transition-all duration-500 hover:shadow-lg ${
                  isVisible ? "opacity-100 translate-x-0" : i % 2 === 0 ? "opacity-0 -translate-x-8" : "opacity-0 translate-x-8"
                }`}
                style={{
                  transitionDelay: `${200 + i * 80}ms`,
                  borderColor: getSoftBorder(sectionBg),
                  backgroundColor: getSoftSurface(sectionBg),
                }}
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryColor}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: theme.primaryColor }} />
                </div>
                <p className="font-medium text-sm leading-relaxed pt-2" style={{ color: bodyColor }}>{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
