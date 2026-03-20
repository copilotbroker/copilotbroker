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

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,6%)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200,60%,40%)]/5 via-transparent to-[hsl(200,60%,40%)]/5" />

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              CONDIÇÃO EXCLUSIVA{" "}
              <span className="text-[hsl(200,60%,55%)]">POR TEMPO LIMITADO</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Condição Curta */}
            <div className={`relative group transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="h-full p-8 rounded-lg bg-[hsl(210,35%,10%)] border-2 border-[hsl(200,60%,40%)]/40 hover:border-[hsl(200,60%,40%)]/60 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[hsl(200,60%,40%)]/20 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-[hsl(200,60%,55%)]" />
                  </div>
                  <div>
                    <span className="text-xs text-[hsl(200,60%,60%)] uppercase tracking-wider">Condição Curta</span>
                    <h3 className="text-xl font-serif font-bold text-white">Pagamento à Vista</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-white/90">25% de desconto real</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-white/90">30x sem juros e sem correção</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-white/90">A partir de R$ 229.000</span>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded bg-[hsl(200,60%,40%)]/10 border border-[hsl(200,60%,40%)]/20 text-center">
                  <p className="text-sm text-[hsl(200,60%,60%)]">Valor já com desconto aplicado</p>
                  <p className="text-3xl font-bold text-white mt-1">R$ 229.000</p>
                  <p className="text-xs text-white/50 mt-1">a partir de</p>
                </div>
              </div>
            </div>

            {/* Condição Longa */}
            <div className={`relative group transition-all duration-700 delay-150 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="h-full p-8 rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(200,60%,40%)]/15 hover:border-[hsl(200,60%,40%)]/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[hsl(200,60%,40%)]/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[hsl(200,60%,55%)]" />
                  </div>
                  <div>
                    <span className="text-xs text-[hsl(200,60%,60%)] uppercase tracking-wider">Condição Longa</span>
                    <h3 className="text-xl font-serif font-bold text-white">Parcelamento Estendido</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5 text-[hsl(200,60%,55%)] shrink-0" />
                    <span className="text-white/90">Entrada facilitada</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[hsl(200,60%,55%)] shrink-0" />
                    <span className="text-white/90">Parcelas estendidas durante a obra</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-[hsl(200,60%,55%)] shrink-0" />
                    <span className="text-white/90">Condição para quem quer mais prazo</span>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded bg-white/5 border border-white/10 text-center">
                  <p className="text-sm text-white/50">Solicite as condições completas</p>
                  <p className="text-lg font-semibold text-white/80 mt-1">Consulte um corretor</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-lg text-white/60 mb-2">
              Últimos lotes disponíveis com essas condições.
            </p>
            <p className="font-serif text-xl md:text-2xl font-semibold text-white">
              Quando acabarem, acabou.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUConditionsSection;
