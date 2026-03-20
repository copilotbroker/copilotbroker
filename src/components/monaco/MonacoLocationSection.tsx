import { useEffect, useRef, useState } from "react";
import { MapPin, TrendingUp, Shield } from "lucide-react";

const MonacoLocationSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(215,45%,5%)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,35%,50%)]/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[hsl(35,35%,55%)]" />
              <span className="text-sm font-medium tracking-widest uppercase text-[hsl(35,35%,60%)]">Localização</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Localização estratégica,{" "}
              <span className="text-[hsl(35,35%,55%)]">potencial raro</span>
            </h2>
          </div>

          <div className="space-y-6 mb-12">
            <div className={`p-6 rounded-lg bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/10 flex items-start gap-4 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
              <TrendingUp className="w-6 h-6 text-[hsl(35,35%,55%)] shrink-0 mt-1" />
              <p className="text-white/80 leading-relaxed">
                A Lagoa dos Quadros é um dos <strong className="text-white">ativos imobiliários mais seguros do litoral</strong>, impulsionado pela escassez de áreas preservadas e pela alta demanda por qualidade de vida com facilidade logística.
              </p>
            </div>

            <div className={`p-6 rounded-lg bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/10 flex items-start gap-4 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
              <Shield className="w-6 h-6 text-[hsl(35,35%,55%)] shrink-0 mt-1" />
              <div>
                <p className="text-white/80 leading-relaxed mb-2">
                  É o tipo de projeto que conversa com quem não está procurando apenas um lote.
                </p>
                <p className="font-serif text-lg text-white font-semibold">
                  Está procurando um <span className="text-[hsl(35,35%,55%)]">ativo escasso, desejado e com apelo de lifestyle real</span>.
                </p>
              </div>
            </div>
          </div>

          <div className={`text-center transition-all duration-700 delay-400 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-sm text-white/50">
              Lagoa dos Quadros — Xangri-lá, RS · Ao lado do aeródromo D1 Fly · 5 min da Estrada do Mar
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MonacoLocationSection;
