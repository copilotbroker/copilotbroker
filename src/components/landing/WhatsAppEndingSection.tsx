import { MessageCircle } from "lucide-react";
import { LandingContent } from "@/types/project";
import { getPalette, getTypography } from "./styles/tokens";

interface Props {
  theme: LandingContent["theme"];
  brokerName?: string | null;
  projectSlug?: string | null;
}

function digitsOnly(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

export default function WhatsAppEndingSection({ theme, brokerName, projectSlug }: Props) {
  const phone = digitsOnly(theme.endingWhatsappPhone || "");
  const defaultMsg = projectSlug
    ? `Olá, tenho interesse no imóvel ${projectSlug}`
    : "Olá! Tenho interesse no imóvel anunciado.";
  const msg = theme.endingWhatsappMessage?.trim() || defaultMsg;
  if (!phone) return null;

  const p = getPalette(theme);
  const t = getTypography(theme);
  const isLuxury = (theme.styleFamily ?? "luxury-noir") === "luxury-noir";

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  if (isLuxury) {
    return (
      <section
        id="formulario"
        className="py-24 md:py-32 text-center relative overflow-hidden"
        style={{
          backgroundColor: p.bg,
          color: "#d8cfb8",
          fontFamily: `"${t.body}", "Inter", system-ui, sans-serif`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(ellipse at center, ${p.primary}30 0%, transparent 60%)` }}
        />
        <div className="container px-4 relative z-10 max-w-2xl mx-auto">
          <h2
            className="mb-4"
            style={{
              fontFamily: `"${t.display}", "Cormorant Garamond", serif`,
              fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
              color: "#f3ede0",
            }}
          >
            Fale {brokerName ? `com ${brokerName}` : "diretamente com o corretor"}
          </h2>
          <p className="mb-10 text-sm sm:text-base" style={{ color: p.muted }}>
            Atendimento personalizado pelo WhatsApp.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 text-sm font-semibold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${p.primary}, ${p.primary})`,
              color: p.primaryFg,
              boxShadow: `0 0 40px ${p.primary}55`,
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
          </a>
        </div>
      </section>
    );
  }

  // Fallback claro para outras famílias
  return (
    <section id="formulario" className="py-20 px-4 text-center bg-background text-foreground">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Fale {brokerName ? `com ${brokerName}` : "com o corretor"}
        </h2>
        <p className="text-muted-foreground mb-8">Atendimento personalizado pelo WhatsApp.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-md font-semibold text-white"
          style={{ backgroundColor: "#25D366" }}
        >
          <MessageCircle className="w-5 h-5" />
          Chamar no WhatsApp
        </a>
      </div>
    </section>
  );
}
