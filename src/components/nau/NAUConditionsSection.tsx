import { useEffect, useRef, useState } from "react";
import { Tag, Clock, Percent, BadgeCheck } from "lucide-react";

const NAUConditionsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,6%)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(24,70%,42%)]/5 via-transparent to-[hsl(24,70%,42%)]/5" />

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <p className="text-base sm:text-lg text-white/60 mb-6 max-w-3xl mx-auto leading-relaxed">
              Esse é o tipo de empreendimento que chama atenção de quem sabe reconhecer uma oportunidade antes da maioria. E, justamente por isso, os melhores momentos de compra costumam acontecer quando ainda existem condições realmente vantajosas.
            </p>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
              ÚLTIMOS LOTES COM{" "}
              <span className="text-[hsl(24,70%,50%)]">CONDIÇÃO EXCLUSIVA</span>
            </h2>
          </div>

          <div className={`max-w-2xl mx-auto mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="p-8 rounded-lg bg-[hsl(210,35%,10%)] border-2 border-[hsl(24,70%,42%)]/40">
              <p className="text-white/70 mb-6 leading-relaxed">
                Hoje, você pode garantir seu espaço no Nau com uma condição curta pensada para quem quer aproveitar o máximo da oportunidade:
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Percent className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-white/90 font-medium">25% de desconto em 30x sem juros e sem correção</span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-white/90 font-medium">Lotes a partir de R$ 229.000, já com desconto</span>
                </div>
              </div>

              <div className="p-4 rounded bg-[hsl(24,70%,42%)]/10 border border-[hsl(24,70%,42%)]/20 text-center mb-6">
                <p className="text-sm text-[hsl(200,60%,60%)]">A partir de</p>
                <p className="text-3xl font-bold text-white mt-1">R$ 229.000</p>
                <p className="text-xs text-white/50 mt-1">já com desconto aplicado</p>
              </div>

              <div className="space-y-3 text-white/70">
                <p>Uma condição objetiva, forte e limitada.</p>
                <p>Feita para quem quer entrar agora em um condomínio com proposta diferenciada, localização estratégica e apelo náutico real.</p>
              </div>
            </div>
          </div>

          <div className={`text-center transition-all duration-1000 delay-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={scrollToForm}
              className="px-10 py-5 bg-[hsl(24,70%,42%)] hover:bg-[hsl(24,70%,36%)] text-white font-semibold uppercase tracking-[0.15em] text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(200,60%,40%,0.3)]"
            >
              Consultar Lotes Disponíveis
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUConditionsSection;
