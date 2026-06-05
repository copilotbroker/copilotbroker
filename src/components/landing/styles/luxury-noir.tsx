/**
 * Luxury Noir — espelha o padrão visual das landings manuais (Aura Legano,
 * CA2589, GoldenView): hero com imagem + overlay escuro, badge pulsante,
 * título serif com palavra-chave em gradiente dourado, divisores finos,
 * cards "card-luxury", botões dourados, ChevronDown indicador.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { LandingContent, CustomSection } from "@/types/project";
import { getIcon } from "../iconMap";
import { getPalette, getTypography } from "./tokens";

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setV(true), { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
  return { ref, v };
}

function S(theme: LandingContent["theme"]) {
  const p = getPalette(theme);
  const t = getTypography(theme);
  return {
    p, t,
    serif: { fontFamily: `"${t.display}", "Cormorant Garamond", serif`, fontWeight: t.displayWeight ?? 600 },
    sans: { fontFamily: `"${t.body}", "Inter", system-ui, sans-serif`, fontWeight: t.bodyWeight ?? 400 },
    goldGradient: `linear-gradient(135deg, ${p.primary} 0%, ${lighten(p.primary, 0.18)} 50%, ${p.primary} 100%)`,
  };
}

// Lighten/darken a hex by a 0–1 amount (towards white/black).
function lighten(hex: string, amount: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const m = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(m(r))}${toHex(m(g))}${toHex(m(b))}`;
}

function splitTitle(title: string) {
  // Coloca a última palavra (ou últimas 2 se a última for muito curta) em destaque dourado.
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return { head: "", tail: title };
  const lastIsShort = words[words.length - 1].length <= 3 && words.length >= 3;
  const tailCount = lastIsShort ? 2 : 1;
  return {
    head: words.slice(0, words.length - tailCount).join(" "),
    tail: words.slice(words.length - tailCount).join(" "),
  };
}

function GoldDivider({ color, width = "5rem" }: { color: string; width?: string }) {
  return (
    <div
      className="mx-auto h-px"
      style={{ width, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
    />
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  if (!text) return null;
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full backdrop-blur-sm"
      style={{ border: `1px solid ${color}66`, backgroundColor: `${color}1a` }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
      <span className="text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase" style={{ color }}>
        {text}
      </span>
    </div>
  );
}

/* ---------------- HERO ---------------- */
export function Hero({ content, theme }: { content: LandingContent["hero"]; theme: LandingContent["theme"] }) {
  const { p, serif, sans, goldGradient } = S(theme);
  const [shown, setShown] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(!content.backgroundImageUrl);
  useEffect(() => {
    setShown(true);
    if (content.backgroundImageUrl) {
      const img = new Image();
      img.onload = () => setImgLoaded(true);
      img.src = content.backgroundImageUrl;
    }
  }, [content.backgroundImageUrl]);

  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  const scrollDown = () => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" });
  const title = splitTitle(content.title);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden text-center"
      style={{ backgroundColor: p.bg, color: "#f3ede0", ...sans }}
    >
      {content.backgroundImageUrl && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundImage: `url(${content.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${p.bg}bf 0%, ${p.bg}99 45%, ${p.bg} 100%)` }}
      />
      <div className="absolute top-0 left-0 right-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${p.primary}, transparent)` }} />

      <div className={`relative z-10 container px-4 pt-24 pb-16 transition-all duration-1000 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="max-w-4xl mx-auto">
          <Badge text={content.badge} color={p.primary} />

          <h1
            className="mb-4 leading-[1.05]"
            style={{ ...serif, fontSize: "clamp(2.5rem, 6.5vw, 5rem)", color: "#f6f1e3" }}
          >
            {title.head && <>{title.head} </>}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: goldGradient, WebkitBackgroundClip: "text" }}
            >
              {title.tail}
            </span>
          </h1>

          <div className="my-8"><GoldDivider color={`${p.primary}aa`} width="4rem" /></div>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto italic mb-4"
            style={{ ...serif, fontWeight: 400, color: "#e4dcc6" }}
          >
            {content.subtitle}
          </p>
          {content.description && (
            <p className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-10" style={{ color: p.muted }}>
              {content.description}
            </p>
          )}

          <button
            onClick={scrollToForm}
            className="inline-flex items-center justify-center px-10 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: goldGradient,
              color: p.primaryFg,
              boxShadow: `0 0 30px ${p.primary}40`,
            }}
          >
            {content.ctaText}
          </button>
        </div>

        <button
          onClick={scrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-60 hover:opacity-100 transition-opacity animate-bounce"
          style={{ color: p.primary }}
          aria-label="Rolar para baixo"
        >
          <ChevronDown className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
export function About({ content, theme }: { content: LandingContent["about"]; theme: LandingContent["theme"] }) {
  const { p, serif, sans, goldGradient } = S(theme);
  const { ref, v } = useReveal();
  const title = splitTitle(content.title);

  return (
    <section
      id="sobre"
      ref={ref as any}
      className="py-20 md:py-32 relative overflow-hidden"
      style={{ backgroundColor: p.bg, color: "#d8cfb8", ...sans }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.primary}40, transparent)` }} />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.primary}40, transparent)` }} />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="mb-6" style={{ ...serif, fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)", color: "#f3ede0" }}>
            {title.head}{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: goldGradient, WebkitBackgroundClip: "text" }}>
              {title.tail}
            </span>
          </h2>

          <div className="my-8"><GoldDivider color={p.primary} /></div>

          <div className="space-y-5 max-w-3xl mx-auto mb-12 text-base sm:text-lg leading-relaxed" style={{ color: p.muted }}>
            {content.paragraphs.map((para, i) => (<p key={i}>{para}</p>))}
          </div>

          {content.highlights?.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mt-12">
              {content.highlights.map((h, i) => {
                const Icon = getIcon(h.icon);
                return (
                  <div
                    key={i}
                    className={`rounded-lg p-6 text-center backdrop-blur-sm transition-all duration-700 hover:scale-[1.02] ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                    style={{
                      backgroundColor: `${p.surface}cc`,
                      border: `1px solid ${p.border}`,
                      transitionDelay: `${i * 120}ms`,
                    }}
                  >
                    <div
                      className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${p.primary}1a`, border: `1px solid ${p.primary}40` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: p.primary }} />
                    </div>
                    <p className="text-sm sm:text-base" style={{ color: "#e4dcc6" }}>{h.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FEATURES ---------------- */
export function Features({ content, theme }: { content: LandingContent["features"]; theme: LandingContent["theme"] }) {
  const { p, serif, sans, goldGradient } = S(theme);
  const { ref, v } = useReveal();
  const title = splitTitle(content.title);

  return (
    <section
      ref={ref as any}
      className="py-20 md:py-32"
      style={{ backgroundColor: p.surface, color: "#d8cfb8", ...sans }}
    >
      <div className="container px-4">
        <div className={`max-w-3xl mx-auto text-center mb-14 transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 style={{ ...serif, fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)", color: "#f3ede0" }}>
            {title.head}{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: goldGradient, WebkitBackgroundClip: "text" }}>
              {title.tail}
            </span>
          </h2>
          <div className="mt-6"><GoldDivider color={p.primary} /></div>
        </div>

        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={i}
                className={`rounded-lg p-6 transition-all duration-700 hover:scale-[1.02] ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{
                  backgroundColor: `${p.bg}cc`,
                  border: `1px solid ${p.border}`,
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${p.primary}1a`, border: `1px solid ${p.primary}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: p.primary }} />
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed pt-1.5" style={{ color: "#e4dcc6" }}>{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {content.closingText && (
          <p
            className="mt-14 text-center text-xl sm:text-2xl max-w-3xl mx-auto italic leading-snug"
            style={{ ...serif, fontWeight: 500, color: p.primary }}
          >
            "{content.closingText}"
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------------- URGENCY ---------------- */
export function Urgency({ content, theme }: { content: LandingContent["urgency"]; theme: LandingContent["theme"] }) {
  const { p, serif, sans, goldGradient } = S(theme);
  const { ref, v } = useReveal();
  const title = splitTitle(content.title);

  return (
    <section
      ref={ref as any}
      className="py-20 md:py-28"
      style={{ backgroundColor: p.bg, color: "#d8cfb8", ...sans }}
    >
      <div className="container px-4">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="mb-10" style={{ ...serif, fontSize: "clamp(1.75rem, 4.5vw, 3rem)", color: "#f3ede0" }}>
            {title.head}{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: goldGradient, WebkitBackgroundClip: "text" }}>
              {title.tail}
            </span>
          </h2>

          <div className="space-y-4 mb-12">
            {content.items.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 text-left max-w-2xl mx-auto p-4 rounded-md"
                  style={{ backgroundColor: `${p.surface}80`, border: `1px solid ${p.border}` }}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: p.primary }} />
                  <p className="text-sm sm:text-base leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>

          {content.warning && (
            <div
              className="max-w-2xl mx-auto p-6 sm:p-8 rounded-md"
              style={{ border: `1px solid ${p.primary}`, backgroundColor: `${p.primary}10` }}
            >
              <p className="italic text-base sm:text-lg leading-relaxed" style={{ color: p.primary, ...serif, fontWeight: 500 }}>
                {content.warning}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BENEFITS ---------------- */
export function Benefits({ content, theme }: { content: LandingContent["benefits"]; theme: LandingContent["theme"] }) {
  const { p, serif, sans, goldGradient } = S(theme);
  const { ref, v } = useReveal();
  const title = splitTitle(content.title);

  return (
    <section
      ref={ref as any}
      className="py-20 md:py-28"
      style={{ backgroundColor: p.surface, color: "#d8cfb8", ...sans }}
    >
      <div className="container px-4">
        <div className={`max-w-3xl mx-auto text-center mb-14 transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 style={{ ...serif, fontSize: "clamp(1.75rem, 4.5vw, 3rem)", color: "#f3ede0" }}>
            {title.head}{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: goldGradient, WebkitBackgroundClip: "text" }}>
              {title.tail}
            </span>
          </h2>
          <div className="mt-6"><GoldDivider color={p.primary} /></div>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={i}
                className={`flex gap-4 p-5 rounded-lg transition-all duration-700 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{
                  backgroundColor: `${p.bg}80`,
                  border: `1px solid ${p.border}`,
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${p.primary}`, backgroundColor: `${p.primary}10` }}
                >
                  <Icon className="w-5 h-5" style={{ color: p.primary }} />
                </div>
                <p className="text-sm sm:text-base leading-relaxed pt-2" style={{ color: "#e4dcc6" }}>{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
export function CTA({ content, theme }: { content: LandingContent["cta"]; theme: LandingContent["theme"] }) {
  const { p, serif, sans, goldGradient } = S(theme);
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  const title = splitTitle(content.title);

  return (
    <section
      className="py-24 md:py-32 text-center relative overflow-hidden"
      style={{ backgroundColor: p.bg, color: "#d8cfb8", ...sans }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: `radial-gradient(ellipse at center, ${p.primary}30 0%, transparent 60%)` }}
      />
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <GoldDivider color={p.primary} />
          <h2 className="my-8" style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3.75rem)", color: "#f3ede0" }}>
            {title.head}{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: goldGradient, WebkitBackgroundClip: "text" }}>
              {title.tail}
            </span>
          </h2>

          {content.quote && (
            <p className="text-lg sm:text-xl mb-10 italic" style={{ ...serif, fontWeight: 400, color: p.primary }}>
              "{content.quote}"
            </p>
          )}

          {content.features?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12 text-sm" style={{ color: p.muted }}>
              {content.features.map((f, i) => {
                const Icon = getIcon(f.icon);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: p.primary }} />
                    {f.text}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={scrollToForm}
            className="inline-flex items-center justify-center px-12 py-5 text-sm font-semibold uppercase tracking-[0.25em] rounded-sm transition-all duration-300 hover:scale-[1.03]"
            style={{ background: goldGradient, color: p.primaryFg, boxShadow: `0 0 40px ${p.primary}55` }}
          >
            {content.buttonText}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
export function Footer({ content, theme }: { content: LandingContent["footer"]; theme: LandingContent["theme"] }) {
  const { p, sans } = S(theme);
  return (
    <footer
      className="py-10 px-6 text-center"
      style={{ backgroundColor: p.bg, borderTop: `1px solid ${p.border}`, color: p.muted, ...sans }}
    >
      <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: p.primary }}>{content.companyName}</p>
      <p className="text-xs max-w-2xl mx-auto leading-relaxed">{content.disclaimer}</p>
    </footer>
  );
}
