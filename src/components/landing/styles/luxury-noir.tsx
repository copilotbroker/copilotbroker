/**
 * Luxury Noir — deep black, sparse gold accents, generous spacing,
 * contemplative serif typography, slow cinematic reveals.
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
    display: { fontFamily: `"${t.display}", serif`, fontWeight: t.displayWeight ?? 400, letterSpacing: "-0.01em" },
    body: { fontFamily: `"${t.body}", sans-serif`, fontWeight: t.bodyWeight ?? 300, letterSpacing: "0.01em" },
  };
}

function GoldRule({ color }: { color: string }) {
  return <div className="mx-auto h-px w-16" style={{ backgroundColor: color }} />;
}

export function Hero({ content, theme }: { content: LandingContent["hero"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 120); return () => clearTimeout(t); }, []);
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-center" style={{ backgroundColor: p.bg, color: p.bg === "#08080a" ? "#f3ede0" : p.muted, ...body }}>
      {content.backgroundImageUrl && (
        <>
          <img src={content.backgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 0%, ${p.bg} 75%)` }} />
        </>
      )}
      <div className={`relative z-10 max-w-4xl mx-auto px-6 md:px-10 transition-all duration-[1400ms] ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <p className="text-[10px] md:text-xs uppercase tracking-[0.45em] mb-10" style={{ color: p.primary }}>{content.badge}</p>
        <GoldRule color={p.primary} />
        <h1 className="my-10 leading-[1.05]" style={{ ...display, fontSize: "clamp(2.75rem, 7vw, 5.75rem)", color: "#f3ede0" }}>
          {content.title}
        </h1>
        <GoldRule color={`${p.primary}66`} />
        <p className="mt-10 text-lg md:text-xl max-w-2xl mx-auto italic leading-relaxed" style={{ ...display, fontWeight: 300, color: "#d8cfb8" }}>
          {content.subtitle}
        </p>
        <p className="mt-6 text-sm md:text-base max-w-xl mx-auto leading-relaxed" style={{ color: p.muted }}>
          {content.description}
        </p>
        <button
          onClick={scrollToForm}
          className="mt-12 inline-block px-12 py-4 text-[11px] uppercase tracking-[0.35em] border transition-all duration-500 hover:tracking-[0.5em]"
          style={{ borderColor: p.primary, color: p.primary, backgroundColor: "transparent" }}
        >
          {content.ctaText}
        </button>
      </div>
    </section>
  );
}

export function About({ content, theme }: { content: LandingContent["about"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const { ref, v } = useReveal();
  return (
    <section id="sobre" ref={ref as any} className="py-28 md:py-40 px-6 md:px-10" style={{ backgroundColor: p.surface, color: "#d8cfb8", ...body }}>
      <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <p className="text-[10px] uppercase tracking-[0.45em] mb-6" style={{ color: p.primary }}>Capítulo I</p>
        <h2 className="mb-10 leading-tight" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.5rem)", color: "#f3ede0" }}>{content.title}</h2>
        <GoldRule color={p.primary} />
        <div className="mt-12 space-y-6 text-lg leading-loose" style={{ color: "#c8bfa8" }}>
          {content.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-px" style={{ backgroundColor: p.border }}>
        {content.highlights.map((h, i) => {
          const Icon = getIcon(h.icon);
          return (
            <div key={i} className="p-10 text-center" style={{ backgroundColor: p.surface }}>
              <Icon className="w-6 h-6 mx-auto mb-5" style={{ color: p.primary }} />
              <p className="text-sm leading-relaxed" style={{ color: "#c8bfa8" }}>{h.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Features({ content, theme }: { content: LandingContent["features"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-28 md:py-40 px-6 md:px-10" style={{ backgroundColor: p.bg, color: "#d8cfb8", ...body }}>
      <div className="max-w-5xl mx-auto text-center mb-20">
        <p className="text-[10px] uppercase tracking-[0.45em] mb-6" style={{ color: p.primary }}>Capítulo II</p>
        <h2 className="leading-tight" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.5rem)", color: "#f3ede0" }}>{content.title}</h2>
        <div className="mt-8"><GoldRule color={p.primary} /></div>
      </div>
      <div className="max-w-4xl mx-auto space-y-px" style={{ backgroundColor: p.border }}>
        {content.items.map((item, i) => {
          const Icon = getIcon(item.icon);
          return (
            <div key={i} className="flex items-center gap-6 p-6 md:p-8" style={{ backgroundColor: p.bg }}>
              <div className="text-2xl tabular-nums" style={{ ...display, color: p.primary }}>{String(i + 1).padStart(2, "0")}</div>
              <div className="w-px h-10" style={{ backgroundColor: p.border }} />
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: p.primary }} />
              <p className="text-base md:text-lg leading-relaxed flex-1">{item.text}</p>
            </div>
          );
        })}
      </div>
      {content.closingText && (
        <p className="mt-16 text-center text-2xl max-w-3xl mx-auto italic leading-snug" style={{ ...display, color: p.primary }}>“{content.closingText}”</p>
      )}
    </section>
  );
}

export function Urgency({ content, theme }: { content: LandingContent["urgency"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-28 px-6 md:px-10" style={{ backgroundColor: p.surface, color: "#d8cfb8", ...body }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.45em] mb-6" style={{ color: p.primary }}>Capítulo III</p>
        <h2 className="leading-tight mb-12" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.25rem)", color: "#f3ede0" }}>{content.title}</h2>
        <div className="space-y-5 mb-14">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="flex items-start gap-4 justify-center text-left max-w-2xl mx-auto">
                <Icon className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: p.primary }} />
                <p className="text-base md:text-lg leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
        <div className="max-w-2xl mx-auto p-8 border" style={{ borderColor: p.primary, backgroundColor: "transparent" }}>
          <p className="italic text-base md:text-lg leading-relaxed" style={{ color: p.primary, ...display, fontWeight: 400 }}>{content.warning}</p>
        </div>
      </div>
    </section>
  );
}

export function Benefits({ content, theme }: { content: LandingContent["benefits"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-28 px-6 md:px-10" style={{ backgroundColor: p.bg, color: "#d8cfb8", ...body }}>
      <div className="max-w-5xl mx-auto text-center mb-20">
        <p className="text-[10px] uppercase tracking-[0.45em] mb-6" style={{ color: p.primary }}>Capítulo IV</p>
        <h2 style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.25rem)", color: "#f3ede0" }}>{content.title}</h2>
      </div>
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
        {content.items.map((item, i) => {
          const Icon = getIcon(item.icon);
          return (
            <div key={i} className="flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center" style={{ borderColor: p.primary }}>
                <Icon className="w-5 h-5" style={{ color: p.primary }} />
              </div>
              <p className="text-base md:text-lg leading-relaxed pt-2">{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CTA({ content, theme }: { content: LandingContent["cta"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="py-36 px-6 md:px-10 text-center" style={{ backgroundColor: p.surface, color: "#d8cfb8", ...body }}>
      <div className="max-w-3xl mx-auto">
        <GoldRule color={p.primary} />
        <h2 className="my-10 leading-tight" style={{ ...display, fontSize: "clamp(2.25rem, 5vw, 4rem)", color: "#f3ede0" }}>{content.title}</h2>
        <p className="text-xl md:text-2xl mb-12 italic leading-relaxed" style={{ ...display, color: p.primary }}>“{content.quote}”</p>
        <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm" style={{ color: p.muted }}>
          {content.features.map((f, i) => {
            const Icon = getIcon(f.icon);
            return <div key={i} className="flex items-center gap-2"><Icon className="w-4 h-4" style={{ color: p.primary }} />{f.text}</div>;
          })}
        </div>
        <button
          onClick={scrollToForm}
          className="px-14 py-5 text-[11px] uppercase tracking-[0.4em] transition-all duration-500 hover:tracking-[0.55em]"
          style={{ backgroundColor: p.primary, color: p.primaryFg, fontWeight: 600 }}
        >
          {content.buttonText}
        </button>
      </div>
    </section>
  );
}

export function Footer({ content, theme }: { content: LandingContent["footer"]; theme: LandingContent["theme"] }) {
  const { p, body } = S(theme);
  return (
    <footer className="py-10 px-6 text-center border-t" style={{ backgroundColor: p.bg, borderColor: p.border, color: p.muted, ...body }}>
      <p className="text-xs uppercase tracking-[0.4em] mb-3" style={{ color: p.primary }}>{content.companyName}</p>
      <p className="text-xs max-w-2xl mx-auto leading-relaxed">{content.disclaimer}</p>
    </footer>
  );
}
