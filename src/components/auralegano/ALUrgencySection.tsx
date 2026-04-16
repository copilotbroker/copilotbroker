import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ALUrgencySection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              AGORA, O QUE{" "}
              <span className="text-gold-gradient">REALMENTE IMPORTA</span>
            </h2>
          </div>

          <div className={`bg-background border-2 border-primary/30 rounded-lg p-8 md:p-10 mb-12 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-primary shrink-0" />
              <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground">
                Restam apenas 15 lotes disponíveis
              </h3>
            </div>

            <p className="text-muted-foreground mb-6">
              <span className="text-primary mr-1">👉</span>
              E cada nova reserva reduz as opções disponíveis.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"} bg-primary/70`}
                  style={{ transitionDelay: `${400 + i * 60}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">15 lotes remanescentes</p>
          </div>

          <div className={`text-center space-y-4 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="inline-block bg-primary/10 border border-primary/30 rounded-lg px-8 py-4">
              <p className="font-serif text-xl md:text-2xl font-bold text-primary">
                Se faz sentido pra você, esse é o momento de agir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ALUrgencySection;
