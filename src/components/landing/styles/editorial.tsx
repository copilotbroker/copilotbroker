/**
 * Editorial Magazine — high-contrast, oversized display serif,
 * broken grid, numbered sections, zig-zag rhythm. Inspired by
 * print magazines and modern editorial sites.
 */
import { LandingContent } from "@/types/project";
import { getIcon } from "../iconMap";
import { getPalette, getTypography } from "./tokens";

const num = (i: number) => String(i + 1).padStart(2, "0");

function S(theme: LandingContent["theme"]) {
  const p = getPalette(theme);
  const t = getTypography(theme);
  return {
    p, t,
    display: { fontFamily: `"${t.display}", serif`, fontWeight: t.displayWeight ?? 600 },
    body: { fontFamily: `"${t.body}", sans-serif`, fontWeight: t.bodyWeight ?? 400 },
  };
}

export function Hero({ content, theme }: { content: LandingContent["hero"]; theme: LandingContent["theme"] }) {
  const { p, t, display, body } = S(theme);
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="relative min-h-[92vh] flex flex-col" style={{ backgroundColor: p.bg, color: p.accent, ...body }}>
      <div className="border-b" style={{ borderColor: p.border }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex justify-between text-[10px] md:text-xs uppercase tracking-[0.25em]" style={{ color: p.muted }}>
          <span>{content.badge}</span>
          <span>Edição Especial — {new Date().getFullYear()}</span>
        </div>
      </div>
      <div className="flex-1 max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20 grid md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <div className="text-[11px] uppercase tracking-[0.35em] mb-6" style={{ color: p.primary, fontFamily: `"${t.body}", sans-serif`, fontWeight: 600 }}>
            № 01 — Manifesto
          </div>
          <h1
            className="leading-[0.92] tracking-tight mb-8"
            style={{ ...display, color: p.accent, fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            {content.title}
          </h1>
          <p className="text-lg md:text-2xl max-w-2xl mb-6 leading-snug" style={{ color: p.accent, fontFamily: `"${t.display}", serif`, fontWeight: 400, fontStyle: "italic" }}>
            {content.subtitle}
          </p>
        </div>
        <div className="md:col-span-4 md:border-l md:pl-8" style={{ borderColor: p.border }}>
          <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: p.muted }}>
            {content.description}
          </p>
          <button
            onClick={scrollToForm}
            className="group inline-flex items-center gap-3 px-7 py-4 text-sm uppercase tracking-[0.2em] transition-all hover:gap-5"
            style={{ backgroundColor: p.primary, color: p.primaryFg, fontWeight: 600, fontFamily: `"${t.body}", sans-serif` }}
          >
            {content.ctaText}
            <span>→</span>
          </button>
        </div>
      </div>
      {content.backgroundImageUrl && (
        <div className="border-t" style={{ borderColor: p.border }}>
          <img src={content.backgroundImageUrl} alt="" className="w-full h-[40vh] object-cover" />
        </div>
      )}
    </section>
  );
}

export function About({ content, theme }: { content: LandingContent["about"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section id="sobre" className="py-20 md:py-32 px-6 md:px-10" style={{ backgroundColor: p.surface, ...body, color: p.accent }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <div className="text-[11px] uppercase tracking-[0.35em] mb-4" style={{ color: p.primary }}>№ 02</div>
          <h2 className="leading-tight" style={{ ...display, fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>{content.title}</h2>
        </div>
        <div className="md:col-span-8 space-y-6 text-lg leading-relaxed" style={{ color: p.accent }}>
          {content.paragraphs.map((para, i) => (
            <p key={i} className={i === 0 ? "text-xl md:text-2xl leading-snug" : ""} style={i === 0 ? { fontFamily: `"${theme.typography?.display ?? "Fraunces"}", serif`, fontStyle: "italic" } : undefined}>
              {para}
            </p>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 border-t border-b" style={{ borderColor: p.border }}>
        {content.highlights.map((h, i) => {
          const Icon = getIcon(h.icon);
          return (
            <div key={i} className={`p-6 md:p-8 ${i > 0 ? "md:border-l" : ""}`} style={{ borderColor: p.border }}>
              <Icon className="w-5 h-5 mb-4" style={{ color: p.primary }} />
              <p className="text-sm leading-snug" style={{ color: p.accent }}>{h.text}</p>
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
    <section className="py-20 md:py-32 px-6 md:px-10" style={{ backgroundColor: p.bg, ...body, color: p.accent }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.35em] mb-4" style={{ color: p.primary }}>№ 03 — Capítulo</div>
          <h2 className="leading-[1.05]" style={{ ...display, fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>{content.title}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="flex gap-6 pb-10 border-b" style={{ borderColor: p.border }}>
                <div className="flex-shrink-0">
                  <div className="text-3xl md:text-4xl tabular-nums" style={{ ...display, color: p.primary }}>{num(i)}</div>
                </div>
                <div>
                  <Icon className="w-5 h-5 mb-4" style={{ color: p.accent }} />
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: p.accent }}>{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        {content.closingText && (
          <p className="mt-16 text-2xl md:text-3xl max-w-3xl leading-snug" style={{ ...display, fontStyle: "italic", color: p.muted }}>
            “{content.closingText}”
          </p>
        )}
      </div>
    </section>
  );
}

export function Urgency({ content, theme }: { content: LandingContent["urgency"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-20 md:py-28 px-6 md:px-10" style={{ backgroundColor: p.accent, color: p.bg, ...body }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="text-[11px] uppercase tracking-[0.35em] mb-4" style={{ color: p.primary }}>№ 04 — Tempo</div>
          <h2 className="leading-[1.05]" style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}>{content.title}</h2>
        </div>
        <div className="md:col-span-7 space-y-5">
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="flex gap-5 items-start py-4 border-t" style={{ borderColor: `${p.bg}1f` }}>
                <Icon className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: p.primary }} />
                <p className="text-base md:text-lg leading-relaxed">{item.text}</p>
              </div>
            );
          })}
          <div className="mt-8 p-6 border-l-4" style={{ borderColor: p.primary, backgroundColor: `${p.primary}10` }}>
            <p className="text-base md:text-lg leading-relaxed" style={{ fontStyle: "italic" }}>{content.warning}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Benefits({ content, theme }: { content: LandingContent["benefits"]; theme: LandingContent["theme"] }) {
  const { p, display, body } = S(theme);
  return (
    <section className="py-20 md:py-28 px-6 md:px-10" style={{ backgroundColor: p.bg, color: p.accent, ...body }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.35em] mb-4" style={{ color: p.primary }}>№ 05 — Por que</div>
          <h2 className="leading-tight" style={{ ...display, fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>{content.title}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px" style={{ backgroundColor: p.border }}>
          {content.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="p-8 md:p-10" style={{ backgroundColor: p.surface }}>
                <Icon className="w-6 h-6 mb-6" style={{ color: p.primary }} />
                <p className="text-base md:text-lg leading-relaxed">{item.text}</p>
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
    <section className="py-24 md:py-36 px-6 md:px-10" style={{ backgroundColor: p.accent, color: p.bg, ...body }}>
      <div className="max-w-5xl mx-auto text-center">
        <div className="text-[11px] uppercase tracking-[0.35em] mb-6" style={{ color: p.primary }}>№ 06 — Próximo passo</div>
        <h2 className="leading-[1] mb-10" style={{ ...display, fontSize: "clamp(2.5rem, 7vw, 6rem)" }}>{content.title}</h2>
        <p className="text-2xl md:text-3xl mb-12 max-w-3xl mx-auto leading-snug" style={{ fontFamily: `"${theme.typography?.display ?? "Fraunces"}", serif`, fontStyle: "italic", color: p.primary }}>
          “{content.quote}”
        </p>
        <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm" style={{ color: `${p.bg}cc` }}>
          {content.features.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <div key={i} className="flex items-center gap-2"><Icon className="w-4 h-4" style={{ color: p.primary }} />{f.text}</div>
            );
          })}
        </div>
        <button
          onClick={scrollToForm}
          className="inline-flex items-center gap-3 px-10 py-5 text-sm uppercase tracking-[0.2em] transition-all hover:gap-5"
          style={{ backgroundColor: p.primary, color: p.primaryFg, fontWeight: 600 }}
        >
          {content.buttonText} <span>→</span>
        </button>
      </div>
    </section>
  );
}

export function Footer({ content, theme }: { content: LandingContent["footer"]; theme: LandingContent["theme"] }) {
  const { p, body } = S(theme);
  return (
    <footer className="py-10 px-6 md:px-10 border-t" style={{ backgroundColor: p.bg, color: p.muted, borderColor: p.border, ...body }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4 text-xs uppercase tracking-[0.2em]">
        <p style={{ color: p.accent, fontWeight: 600 }}>{content.companyName}</p>
        <p className="max-w-xl normal-case tracking-normal text-xs leading-relaxed">{content.disclaimer}</p>
      </div>
    </footer>
  );
}
