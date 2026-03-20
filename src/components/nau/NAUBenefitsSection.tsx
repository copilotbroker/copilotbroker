import { useEffect, useRef, useState } from "react";
import { Zap, CheckCircle2, Bell, Phone } from "lucide-react";

const benefits = [
  { icon: Zap, text: "Acesso antecipado aos melhores lotes" },
  { icon: CheckCircle2, text: "Prioridade na escolha: navegável, beira lago ou seco" },
  { icon: Bell, text: "Condições exclusivas antes da abertura geral" },
  { icon: Phone, text: "Contato direto com corretor especializado" },
];

const NAUBenefitsSection = () => {
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
      className="py-20 md:py-32 bg-[hsl(210,35%,8%)] relative overflow-hidden"
    >
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              CADASTRE-SE E GARANTA SUA VANTAGEM.
            </h2>
            <p className="font-serif text-xl md:text-2xl text-[hsl(200,60%,55%)]">
              Poucos lotes. Muitos interessados.
            </p>
          </div>

          <div className={`mb-12 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-center text-white/60 mb-8">Ao se cadastrar, você garante:</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.text}
                  className={`flex items-center gap-4 p-5 bg-[hsl(210,35%,10%)] rounded-lg border border-[hsl(200,60%,40%)]/10 hover:border-[hsl(200,60%,40%)]/30 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 shrink-0 rounded-full bg-[hsl(200,60%,40%)]/10 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-[hsl(200,60%,55%)]" />
                  </div>
                  <span className="text-white/90">
                    <span className="text-[hsl(200,60%,55%)] mr-1">✔</span>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="w-20 h-px bg-[hsl(200,60%,40%)]/30 mx-auto mb-8" />
            <p className="text-lg text-white/60 mb-2">Sem cadastro, você fica na fila.</p>
            <p className="font-serif text-xl md:text-2xl font-semibold text-white">
              E a fila não escolhe lote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUBenefitsSection;
