import { useEffect, useRef, useState } from "react";
import { Ruler, MapPin, Trees, Zap, Building2 } from "lucide-react";

const features = [
  { icon: Ruler, text: "12m de frente x 38m de profundidade" },
  { icon: MapPin, text: "Localização na parte alta do condomínio" },
  { icon: Trees, text: "Fundos privativos com vegetação" },
  { icon: Zap, text: "Cercamento eletrônico" },
  { icon: Building2, text: "Próximo à área social" },
];

const ALLotSection = () => {
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
    <section id="terreno" ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-3">Terreno disponível</p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            SOBRE O TERRENO{" "}
            <span className="text-gold-gradient">DISPONÍVEL</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 mb-10">
          {features.map((feature, index) => (
            <div
              key={feature.text}
              className={`flex items-center gap-4 p-5 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-foreground">
                <span className="text-primary mr-2">✔</span>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-serif text-lg md:text-xl italic text-muted-foreground">
            <span className="text-primary">👉</span> Um terreno que une privacidade, posição e praticidade.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ALLotSection;
