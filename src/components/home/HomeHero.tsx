import { useEffect, useRef, useState } from "react";
import { MessageCircle, Zap } from "lucide-react";
import heroImg from "@/assets/copilot-hero.jpg";

const WHATSAPP_URL =
  "https://wa.me/5551997010323?text=Quero%20saber%20mais%20sobre%20o%20Copilot%20Broker";

const HomeHero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] flex items-center justify-center px-4 py-16 sm:py-20 overflow-hidden bg-[#0a0a0f]"
      aria-labelledby="hero-heading"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-[#0a0a0f]/85 to-[#0a0a0f]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[160px]" />
      </div>

      <div
        className={`relative z-10 max-w-5xl mx-auto text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Top alert badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-primary/40 bg-primary/10">
          <Zap className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-bold tracking-wide uppercase text-primary">
            ATENÇÃO: Imobiliárias e corretores do RS
          </span>
        </div>

        <h1
          id="hero-heading"
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
        >
          Pare de perder leads no{" "}
          <span className="text-primary">WhatsApp</span> e venda{" "}
          <span className="underline decoration-primary decoration-4 underline-offset-4">
            até 3x mais imóveis
          </span>{" "}
          em 30 dias
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-white/80 leading-relaxed max-w-3xl mx-auto mb-4">
          O <strong className="text-primary">Copilot Broker</strong> é o CRM com IA que
          atende, qualifica e distribui seus leads no WhatsApp{" "}
          <strong className="text-white">automaticamente</strong> — enquanto você dorme,
          treina equipe ou fecha negócio.
        </p>

        <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-10 italic">
          Sem planilha. Sem lead esquecido. Sem corretor passando a mão no celular.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_60px_hsl(var(--primary)/0.5)] hover:scale-[1.03] transition-all"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            QUERO TESTAR GRÁTIS POR 7 DIAS
          </a>
        </div>

        <p className="text-xs sm:text-sm text-white/50">
          ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Setup em 24h &nbsp;·&nbsp; ✓ Cancela
          quando quiser
        </p>
      </div>
    </section>
  );
};

export default HomeHero;
