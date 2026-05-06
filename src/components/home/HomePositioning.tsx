import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";

const antes = [
  "2 a 3 mensagens no WhatsApp",
  'Lead não respondeu? "Curioso"',
  "Desistiu. Próximo lead.",
  "Resultado: vendas perdidas",
];

const agora = [
  "7 toques automáticos em 10 dias por lead",
  "Cadência 10D validada rodando sozinha",
  "Nenhum lead esquecido. Nunca.",
  "Resultado: até 4x mais vendas",
];

const HomePositioning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => e.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) o.observe(sectionRef.current);
    return () => o.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="vender-mais"
      className="py-16 sm:py-20 px-4 bg-[#0f0f12]"
      aria-labelledby="positioning-heading"
    >
      <div
        className={`container max-w-5xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center mb-12">
          <h2
            id="positioning-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Corretores começaram a vender{" "}
            <span className="text-primary">até 4x mais</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg">
            O que mudou? <strong className="text-white">O processo de follow-up.</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Antes */}
          <div className="p-7 rounded-xl bg-[#111114] border border-destructive/30">
            <p className="inline-block px-3 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-bold uppercase tracking-wider mb-5">
              Antes
            </p>
            <ul className="space-y-3" role="list">
              {antes.map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/85 text-sm sm:text-base">
                  <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-5 border-t border-[#1e1e22] text-white/60 text-sm italic">
              <strong className="text-destructive not-italic">87% dos leads "perdidos"</strong> retornam
              no 6º toque. Você parou no 2º.
            </p>
          </div>

          {/* Agora */}
          <div className="p-7 rounded-xl bg-[#111114] border-2 border-primary/40 shadow-[0_0_60px_hsl(var(--primary)/0.15)]">
            <p className="inline-block px-3 py-1 rounded-md bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-5">
              Agora com o Copilot Broker
            </p>
            <ul className="space-y-3" role="list">
              {agora.map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/90 text-sm sm:text-base">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-5 border-t border-[#1e1e22] text-white/75 text-sm">
              Sem falha. Sem esquecimento. Sem depender do seu humor.
            </p>
          </div>
        </div>

        <p className="text-center font-serif text-xl sm:text-2xl text-primary italic">
          Isso é ter um Copilot Broker vendendo por você.
        </p>
      </div>
    </section>
  );
};

export default HomePositioning;
