/**
 * Modern Glass — dark canvas, mesh gradients, glassmorphism cards,
 * bento grids, vibrant accents. For tech-forward / urban projects.
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
    display: { fontFamily: `"${t.display}", sans-serif`, fontWeight: t.displayWeight ?? 700, letterSpacing: "-0.03em" },
    body: { fontFamily: `"${t.body}", sans-serif`, fontWeight: t.bodyWeight ?? 400 },
  };
}

function Mesh({ p }: { p: ReturnType<typeof getPalette> }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/3 -left-1/4 w-[700px] h-[700px] rounded-full blur-3xl opacity-40" style={{ background: `radial-gradient(circle, ${p.primary}, transparent 70%)` }} />
      <div className="absolute -bottom-1/3 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-30" style={{ background: `radial-gradient(circle, ${p.accent}, transparent 70%)` }} />
      <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-20" style={{ background: `radial-gradient(circle, ${p.primary}, transparent 70%)` }} />
    </div>
  );
}

export function Hero({ content, theme }: { content: LandingContent["hero"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 80); return () => clearTimeout(t); }, []);
  const scrollToForm = () => (document.getElementById("sobre") || document.getElementById("formulario"))?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: p.bg, color: "#f1f5f9", ...body }}>
      <Mesh p={p} />
      {content.backgroundImageUrl && (
        <img src={content.backgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity" />
      )}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-20 w-full transition-all duration-1000 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs backdrop-blur-md border" style={{ borderColor: `${p.primary}55`, backgroundColor: `${p.primary}15`, color: p.primary, fontWeight: 600 }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: p.primary }} />
          {content.badge}
        </div>
        <h1 className="leading-[0.95] mb-8 max-w-5xl" style={{ ...display, fontSize: "clamp(2.75rem, 8vw, 6.5rem)" }}>
          <span style={{ background: `linear-gradient(135deg, #f1f5f9 0%, ${p.primary} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {content.title}
          </span>
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mb-5 leading-snug" style={{ color: "#cbd5e1", fontWeight: 500 }}>{content.subtitle}</p>
        <p className="text-base md:text-lg max-w-xl mb-10 leading-relaxed" style={{ color: p.muted }}>{content.description}</p>
        <button
          onClick={scrollToForm}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all hover:scale-[1.02]"
          style={{ backgroundColor: p.primary, color: p.primaryFg, boxShadow: `0 20px 60px -10px ${p.primary}80` }}
        >
          {content.ctaText}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </section>
  );
}

export function About({ content, theme }: { content: LandingContent["about"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const { ref, v } = useReveal();
  return (
    <section id="sobre" ref={ref as any} className="relative py-24 md:py-32 px-6 md:px-10 overflow-hidden" style={{ backgroundColor: p.bg, color: "#f1f5f9", ...body }}>
      <Mesh p={p} />
      <div className="relative max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="leading-tight mb-8" style={{ ...display, fontSize: "clamp(2rem, 5vw, 4rem)" }}>{content.title}</h2>
          <div className="space-y-5 max-w-3xl mx-auto text-lg leading-relaxed" style={{ color: "#cbd5e1" }}>
            {content.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {content.highlights.map((h, i) => {
            const Icon = getIcon(h.icon);
            return (
              <div key={i} className="p-6 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: `${p.surface}cc`, borderColor: `${p.primary}22` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${p.primary}22` }}>
                  <Icon className="w-5 h-5" style={{ color: p.primary }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{h.text}</p>
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
  // bento sizes for variety
  const sizes = ["md:col-span-2 md:row-span-2", "", "", "md:col-span-2", "", "md:row-span-2", "md:col-span-2", "", ""];
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 overflow-hidden" style={{ backgroundColor: p.bg, color: "#f1f5f9", ...body }}>
      <Mesh p={p} />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="leading-tight mb-4" style={{ ...display, fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>{content.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[180px] gap-4">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            const span = sizes[i % sizes.length];
            const featured = span.includes("col-span-2") && span.includes("row-span-2");
            return (
              <div
                key={i}
                className={`relative p-6 md:p-8 rounded-3xl backdrop-blur-xl border overflow-hidden group transition-all hover:scale-[1.01] ${span}`}
                style={{ backgroundColor: `${p.surface}cc`, borderColor: `${p.primary}22` }}
              >
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-2xl" style={{ background: p.primary }} />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${p.primary}22` }}>
                    <Icon className="w-6 h-6" style={{ color: p.primary }} />
                  </div>
                  <p className={`leading-snug ${featured ? "text-xl md:text-2xl font-semibold" : "text-base"}`} style={{ color: "#f1f5f9" }}>{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        {content.closingText && (
          <p className="text-center mt-12 text-xl italic max-w-3xl mx-auto" style={{ color: p.primary }}>{content.closingText}</p>
        )}
      </div>
    </section>
  );
}

export function Urgency({ content, theme }: { content: LandingContent["urgency"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="relative py-24 px-6 md:px-10 overflow-hidden" style={{ backgroundColor: p.bg, color: "#f1f5f9", ...body }}>
      <Mesh p={p} />
      <div className="relative max-w-5xl mx-auto">
        <div className="rounded-3xl p-8 md:p-12 backdrop-blur-xl border" style={{ backgroundColor: `${p.surface}cc`, borderColor: `${p.primary}33` }}>
          <h2 className="leading-tight mb-10" style={{ ...display, fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>{content.title}</h2>
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {content.items.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: `${p.bg}80` }}>
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: p.primary }} />
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: "#e2e8f0" }}>{item.text}</p>
                </div>
              );
            })}
          </div>
          <div className="p-5 rounded-2xl border-l-4" style={{ borderColor: p.primary, backgroundColor: `${p.primary}15` }}>
            <p className="text-base md:text-lg leading-relaxed font-medium">{content.warning}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Benefits({ content, theme }: { content: LandingContent["benefits"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="relative py-24 px-6 md:px-10 overflow-hidden" style={{ backgroundColor: p.bg, color: "#f1f5f9", ...body }}>
      <Mesh p={p} />
      <div className="relative max-w-6xl mx-auto">
        <h2 className="text-center leading-tight mb-14" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}>{content.title}</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="flex gap-5 p-6 rounded-2xl backdrop-blur-xl border transition-all hover:border-opacity-50" style={{ backgroundColor: `${p.surface}cc`, borderColor: `${p.primary}22` }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${p.primary}22` }}>
                  <Icon className="w-5 h-5" style={{ color: p.primary }} />
                </div>
                <p className="text-base leading-relaxed pt-2.5" style={{ color: "#e2e8f0" }}>{item.text}</p>
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
    <section className="relative py-28 md:py-36 px-6 md:px-10 overflow-hidden text-center" style={{ backgroundColor: p.bg, color: "#f1f5f9", ...body }}>
      <Mesh p={p} />
      <div className="relative max-w-4xl mx-auto">
        <h2 className="leading-[0.95] mb-8" style={{ ...display, fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}>
          <span style={{ background: `linear-gradient(135deg, #f1f5f9 0%, ${p.primary} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {content.title}
          </span>
        </h2>
        <p className="text-xl md:text-2xl mb-10 italic leading-snug" style={{ color: p.primary, fontWeight: 500 }}>“{content.quote}”</p>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {content.features.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border text-sm" style={{ backgroundColor: `${p.surface}cc`, borderColor: `${p.primary}33`, color: "#e2e8f0" }}>
                <Icon className="w-4 h-4" style={{ color: p.primary }} />{f.text}
              </div>
            );
          })}
        </div>
        <button
          onClick={scrollToForm}
          className="px-10 py-5 rounded-full text-lg font-semibold transition-all hover:scale-105"
          style={{ backgroundColor: p.primary, color: p.primaryFg, boxShadow: `0 25px 80px -10px ${p.primary}80` }}
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
    <footer className="py-10 px-6 text-center border-t" style={{ backgroundColor: p.bg, borderColor: `${p.primary}22`, color: p.muted, ...body }}>
      <p className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>{content.companyName}</p>
      <p className="text-xs max-w-2xl mx-auto leading-relaxed">{content.disclaimer}</p>
    </footer>
  );
}
