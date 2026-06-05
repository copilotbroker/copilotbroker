/**
 * Nature Organic — warm sand & sage palette, soft organic curves,
 * humanist typography, asymmetric calm composition.
 */
import { useEffect, useRef, useState } from "react";
import { LandingContent } from "@/types/project";
import { getIcon } from "../iconMap";
import { getPalette, getTypography } from "./tokens";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setV(true), { threshold: 0.15 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, v };
}

function S(theme: LandingContent["theme"]) {
  const p = getPalette(theme);
  const t = getTypography(theme);
  return {
    p, t,
    display: { fontFamily: `"${t.display}", serif`, fontWeight: t.displayWeight ?? 500, letterSpacing: "-0.01em" },
    body: { fontFamily: `"${t.body}", sans-serif`, fontWeight: t.bodyWeight ?? 400 },
  };
}

const blobA = "70% 30% 50% 50% / 60% 40% 60% 40%";
const blobB = "40% 60% 60% 40% / 70% 30% 70% 30%";
const blobC = "50% 50% 70% 30% / 40% 60% 40% 60%";

export function Hero({ content, theme }: { content: LandingContent["hero"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 80); return () => clearTimeout(t); }, []);
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="relative min-h-screen flex items-center px-6 md:px-10 py-20 overflow-hidden" style={{ backgroundColor: p.bg, color: p.accent, ...body }}>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] opacity-30" style={{ backgroundColor: p.primary, borderRadius: blobA }} />
      <div className="absolute -bottom-40 -right-32 w-[600px] h-[600px] opacity-20" style={{ backgroundColor: p.accent, borderRadius: blobB }} />
      <div className={`relative z-10 max-w-7xl mx-auto w-full grid md:grid-cols-12 gap-10 items-center transition-all duration-1000 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 mb-8 text-xs uppercase tracking-[0.2em]" style={{ color: p.primary, fontWeight: 600 }}>
            <span className="w-8 h-px" style={{ backgroundColor: p.primary }} />
            {content.badge}
          </div>
          <h1 className="leading-[1.05] mb-8" style={{ ...display, fontSize: "clamp(2.5rem, 7vw, 5.5rem)", color: p.accent }}>
            {content.title}
          </h1>
          <p className="text-xl md:text-2xl mb-6 max-w-xl leading-snug italic" style={{ ...display, fontWeight: 400, color: p.muted }}>
            {content.subtitle}
          </p>
          <p className="text-base md:text-lg mb-10 max-w-lg leading-relaxed" style={{ color: p.muted }}>
            {content.description}
          </p>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold transition-all hover:gap-5"
            style={{ backgroundColor: p.primary, color: p.primaryFg, borderRadius: "999px" }}
          >
            {content.ctaText} <span>→</span>
          </button>
        </div>
        <div className="md:col-span-5 relative">
          <div className="relative aspect-[4/5] overflow-hidden" style={{ borderRadius: blobC, backgroundColor: `${p.primary}15` }}>
            {content.backgroundImageUrl ? (
              <img src={content.backgroundImageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.primary}40, ${p.accent}30)` }} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function About({ content, theme }: { content: LandingContent["about"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const { ref, v } = useReveal();
  return (
    <section id="sobre" ref={ref as any} className="py-24 md:py-32 px-6 md:px-10" style={{ backgroundColor: p.surface, color: p.accent, ...body }}>
      <div className={`max-w-6xl mx-auto transition-all duration-700 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <div className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: p.primary, fontWeight: 600 }}>Nossa essência</div>
            <h2 className="leading-tight" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}>{content.title}</h2>
          </div>
          <div className="md:col-span-7 space-y-5 text-lg leading-relaxed" style={{ color: p.muted }}>
            {content.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.highlights.map((h, i) => {
            const Icon = getIcon(h.icon);
            return (
              <div key={i} className="p-7 flex items-start gap-4" style={{ backgroundColor: p.bg, borderRadius: i % 2 === 0 ? "32px 12px 32px 12px" : "12px 32px 12px 32px" }}>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center" style={{ backgroundColor: `${p.primary}20`, borderRadius: blobA }}>
                  <Icon className="w-5 h-5" style={{ color: p.primary }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: p.accent }}>{h.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Features({ content, theme }: { content: LandingContent["features"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 relative overflow-hidden" style={{ backgroundColor: p.bg, color: p.accent, ...body }}>
      <div className="absolute top-20 -right-40 w-[400px] h-[400px] opacity-20" style={{ backgroundColor: p.primary, borderRadius: blobA }} />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="leading-tight" style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.75rem)" }}>{content.title}</h2>
        </div>
        <div className="space-y-6">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            const flip = i % 2 === 1;
            return (
              <div key={i} className={`flex items-center gap-6 p-6 md:p-8 ${flip ? "md:flex-row-reverse md:text-right" : ""}`} style={{ backgroundColor: p.surface, borderRadius: flip ? "12px 48px 12px 48px" : "48px 12px 48px 12px" }}>
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center" style={{ backgroundColor: `${p.primary}20`, borderRadius: blobB }}>
                  <Icon className="w-7 h-7" style={{ color: p.primary }} />
                </div>
                <p className="text-base md:text-lg leading-relaxed flex-1" style={{ color: p.accent }}>{item.text}</p>
              </div>
            );
          })}
        </div>
        {content.closingText && (
          <p className="text-center mt-14 text-2xl italic max-w-3xl mx-auto" style={{ ...display, color: p.primary }}>“{content.closingText}”</p>
        )}
      </div>
    </section>
  );
}

export function Urgency({ content, theme }: { content: LandingContent["urgency"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-24 px-6 md:px-10" style={{ backgroundColor: p.accent, color: p.bg, ...body }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center leading-tight mb-12" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.25rem)", color: p.bg }}>{content.title}</h2>
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="flex items-start gap-4 p-6" style={{ backgroundColor: `${p.bg}10`, borderRadius: "28px 10px 28px 10px" }}>
                <Icon className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: p.primary }} />
                <p className="text-base leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
        <div className="p-6 text-center" style={{ borderRadius: "32px", backgroundColor: p.primary, color: p.primaryFg }}>
          <p className="text-base md:text-lg italic leading-relaxed">{content.warning}</p>
        </div>
      </div>
    </section>
  );
}

export function Benefits({ content, theme }: { content: LandingContent["benefits"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-24 px-6 md:px-10" style={{ backgroundColor: p.surface, color: p.accent, ...body }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center mb-14 leading-tight" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}>{content.title}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="flex gap-5 p-7" style={{ backgroundColor: p.bg, borderRadius: i % 2 === 0 ? "36px 12px 36px 12px" : "12px 36px 12px 36px" }}>
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center" style={{ backgroundColor: `${p.primary}20`, borderRadius: blobC }}>
                  <Icon className="w-5 h-5" style={{ color: p.primary }} />
                </div>
                <p className="text-base leading-relaxed pt-2" style={{ color: p.accent }}>{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CTA({ content, theme }: { content: LandingContent["cta"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="py-28 md:py-36 px-6 md:px-10 relative overflow-hidden text-center" style={{ backgroundColor: p.bg, color: p.accent, ...body }}>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-20" style={{ backgroundColor: p.primary, borderRadius: blobA }} />
      <div className="relative max-w-3xl mx-auto">
        <h2 className="leading-tight mb-8" style={{ ...display, fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}>{content.title}</h2>
        <p className="text-xl md:text-2xl italic mb-12 leading-snug" style={{ ...display, color: p.primary }}>“{content.quote}”</p>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {content.features.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <div key={i} className="flex items-center gap-2 px-5 py-2 text-sm" style={{ backgroundColor: p.surface, borderRadius: "999px", color: p.accent }}>
                <Icon className="w-4 h-4" style={{ color: p.primary }} />{f.text}
              </div>
            );
          })}
        </div>
        <button
          onClick={scrollToForm}
          className="px-10 py-5 text-lg font-semibold transition-all hover:scale-[1.03]"
          style={{ backgroundColor: p.primary, color: p.primaryFg, borderRadius: "999px", boxShadow: `0 20px 50px -15px ${p.primary}80` }}
        >
          {content.buttonText} →
        </button>
      </div>
    </section>
  );
}

export function Footer({ content, theme }: { content: LandingContent["footer"]; theme: LandingContent["theme"] }) {
  const { p, body } = S(theme);
  return (
    <footer className="py-10 px-6 text-center" style={{ backgroundColor: p.accent, color: `${p.bg}cc`, ...body }}>
      <p className="text-sm font-semibold mb-2" style={{ color: p.bg }}>{content.companyName}</p>
      <p className="text-xs max-w-2xl mx-auto leading-relaxed">{content.disclaimer}</p>
    </footer>
  );
}
