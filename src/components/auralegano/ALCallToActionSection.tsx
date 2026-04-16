import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Wallet, Calculator } from "lucide-react";

const features = [
  { icon: Wallet, text: "Parcelamento direto com a urbanizadora" },
  { icon: CheckCircle2, text: "Condições especiais para pagamento à vista" },
  { icon: Calculator, text: "Simulação personalizada" },
];

const ALCallToActionSection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              QUERO GARANTIR{" "}
              <span className="text-gold-gradient">MEU LOTE</span>
            </h2>
            <p className="font-serif text-base sm:text-lg md:text-xl text-muted-foreground italic">
              Antes que as últimas unidades sejam definidas
            </p>
          </div>

          <div className={`grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            {features.map((feature, index) => (
              <div
                key={feature.text}
                className="flex flex-col items-center gap-3 p-5 bg-card rounded-lg border border-primary/20"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <feature.icon className="w-7 h-7 text-primary" />
                <span className="text-sm text-foreground text-center">
                  <span className="text-primary mr-1">✔</span>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <button onClick={scrollToForm} className="btn-primary text-base px-10 py-5 animate-pulse-slow">
              Quero Garantir Meu Lote
            </button>
            <p className="text-xs text-muted-foreground mt-4">Cadastro gratuito. Restam apenas 15 lotes.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ALCallToActionSection;
