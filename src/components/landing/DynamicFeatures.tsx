import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "./iconMap";
import { getMutedTextColor, getReadableTextColor, getSoftBorder, getSoftSurface } from "@/lib/landing-theme";

interface Props {
  content: LandingContent["features"];
  theme: LandingContent["theme"];
}

export default function DynamicFeatures({ content, theme }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isListLayout = content.layout === "list-with-image";
  const isSerif = theme.fontFamily === "serif";
  const headingColor = getReadableTextColor(theme.accentColor);
  const bodyColor = getMutedTextColor(theme.accentColor);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-14 md:py-28 px-4" style={{ backgroundColor: theme.accentColor }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-14 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          } ${isSerif ? "font-serif italic" : ""}`}
          style={{ color: headingColor }}
        >
          {content.title}
        </h2>

        {isListLayout && content.imageUrl ? (
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 space-y-4">
              {content.items.map((item, i) => {
                const Icon = getIcon(item.icon);
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    }`}
                    style={{
                      transitionDelay: `${i * 100}ms`,
                      borderColor: getSoftBorder(theme.accentColor),
                      backgroundColor: getSoftSurface(theme.accentColor),
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${theme.primaryColor}25` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: theme.primaryColor }} />
                    </div>
                    <p className="text-sm font-medium pt-2" style={{ color: bodyColor }}>
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
            <div
              className={`flex-1 transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <img
                src={content.imageUrl}
                alt=""
                className="w-full rounded-2xl shadow-2xl object-cover max-h-[500px]"
                style={{ border: `1px solid ${theme.primaryColor}20` }}
              />
            </div>
          </div>
        ) : (
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
                    borderColor: getSoftBorder(theme.accentColor),
                    backgroundColor: getSoftSurface(theme.accentColor),
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${theme.primaryColor}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: theme.primaryColor }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: bodyColor }}>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {content.closingText && (
          <p
            className={`text-center mt-12 text-lg italic max-w-2xl mx-auto transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            } ${isSerif ? "font-serif" : ""}`}
            style={{ color: bodyColor }}
          >
            {content.closingText}
          </p>
        )}
      </div>
    </section>
  );
}
