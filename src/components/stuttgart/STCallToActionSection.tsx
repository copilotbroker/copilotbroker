import { useEffect, useRef, useState } from "react";
import { Sparkles, MapPin, TrendingUp } from "lucide-react";

const features = [
  { icon: Sparkles, text: "Condomínio clube completo" },
  { icon: TrendingUp, text: "Alta procura" },
  { icon: MapPin, text: "Localização privilegiada" },
];

const STCallToActionSection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              SEJA HONESTO{" "}
              <span className="text-gold-gradient">COM VOCÊ MESMO</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8">Projetos com:</p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={feature.text}
                  className={`flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-primary/30 transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground">
              <span className="text-primary">👉</span> Com a obra em andamento, as unidades remanescentes vão rápido.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <p className="font-serif text-lg md:text-xl text-muted-foreground mb-2">
              Unidades a partir de
            </p>
            <p className="font-serif text-3xl md:text-4xl font-bold text-gold-gradient mb-8">
              R$ 634.664,00
            </p>
            <button onClick={scrollToForm} className="btn-primary text-base px-10 py-5 animate-pulse-slow">
              Garanta Sua Prioridade Agora
            </button>
            <p className="text-xs text-muted-foreground mt-4">Cadastro gratuito. Acesso limitado.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default STCallToActionSection;
