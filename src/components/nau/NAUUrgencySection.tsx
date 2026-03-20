import { useEffect, useRef, useState } from "react";
import { UserCheck, Mail, MousePointerClick, ShoppingCart, AlertTriangle } from "lucide-react";

const priorities = [
  { icon: UserCheck, text: "Se cadastra antes" },
  { icon: Mail, text: "Recebe as condições primeiro" },
  { icon: MousePointerClick, text: "Escolhe o melhor lote" },
  { icon: ShoppingCart, text: "Garante o desconto" },
];

const NAUUrgencySection = () => {
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
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              OS MELHORES LOTES{" "}
              <span className="text-[hsl(200,60%,55%)]">NÃO VÃO ESPERAR</span>
            </h2>
          </div>

          <div className={`bg-[hsl(210,35%,10%)] border-2 border-[hsl(200,60%,40%)]/30 rounded-lg p-8 mb-12 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-[hsl(200,60%,55%)]" />
              <h3 className="font-serif text-xl md:text-2xl font-bold text-white">
                LOTES BEIRA LAGO E NAVEGÁVEIS SÃO OS PRIMEIROS A ACABAR.
              </h3>
            </div>

            <p className="text-white/60 mb-6">Quem garante primeiro:</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {priorities.map((item, index) => (
                <div
                  key={item.text}
                  className={`flex items-center gap-3 p-4 bg-[hsl(210,35%,8%)] rounded-lg border border-[hsl(200,60%,40%)]/10 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(200,60%,40%)]/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[hsl(200,60%,55%)]" />
                  </div>
                  <span className="text-white/90 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`text-center space-y-6 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-lg text-white/60">
              Quando a condição de 25% acabar, o valor volta ao normal.
            </p>
            <div className="inline-block bg-[hsl(200,60%,40%)]/10 border border-[hsl(200,60%,40%)]/30 rounded-lg px-8 py-4">
              <p className="font-serif text-xl md:text-2xl font-bold text-[hsl(200,60%,55%)]">
                "Esses lotes já foram vendidos."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUUrgencySection;
