import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "./iconMap";

interface Props {
  content: LandingContent["cta"];
  theme: LandingContent["theme"];
}

export default function DynamicCTA({ content, theme }: Props) {
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

  const scrollToForm = () => {
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="py-14 md:py-28 px-4"
      style={{
        background: `linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.accentColor}dd 100%)`,
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className={`text-3xl md:text-5xl font-bold mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ color: "#ffffff" }}
        >
          {content.title}
        </h2>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {content.features.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all duration-500 ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                style={{
                  transitionDelay: `${300 + i * 80}ms`,
                  borderColor: `${theme.primaryColor}40`,
                  backgroundColor: `${theme.primaryColor}12`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: theme.primaryColor }} />
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {f.text}
                </span>
              </div>
            );
          })}
        </div>

        <blockquote
          className={`text-lg md:text-xl italic mb-10 max-w-2xl mx-auto transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: `${theme.primaryColor}cc` }}
        >
          "{content.quote}"
        </blockquote>

        <button
          onClick={scrollToForm}
          className={`px-12 py-5 rounded-full text-lg font-bold transition-all duration-500 delay-700 hover:scale-105 hover:shadow-2xl ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.accentColor,
            boxShadow: `0 15px 50px ${theme.primaryColor}40`,
          }}
        >
          {content.buttonText}
        </button>
      </div>
    </section>
  );
}
