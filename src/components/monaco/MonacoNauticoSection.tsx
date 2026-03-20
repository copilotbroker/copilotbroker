import { useEffect, useRef, useState } from "react";
import { Anchor, Waves, Home, Maximize, Layers } from "lucide-react";

const highlights = [
  { icon: Anchor, text: "Canais navegáveis conectando lagos, marina e residências" },
  { icon: Waves, text: "12 hectares de lagos navegáveis" },
  { icon: Layers, text: "367 lotes com até 1.345 m²" },
  { icon: Home, text: "Casas com até 3 pavimentos e taxa de ocupação de até 37%" },
  { icon: Maximize, text: "Possibilidade de píer privativo nos fundos dos terrenos" },
];

const MonacoNauticoSection = () => {
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
      id="nautico"
      ref={sectionRef}
      className="py-20 md:py-32 bg-card relative overflow-hidden"
    >
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            UM CONDOMÍNIO NÁUTICO ONDE A ÁGUA{" "}
            <span className="text-gold-gradient">FAZ PARTE DA VIDA</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            No Mônaco, os canais navegáveis conectam lagos, marina e residências com fluidez e segurança, criando uma experiência única para quem valoriza liberdade real.
          </p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {highlights.map((item, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center pt-3">
                <p className="text-base sm:text-lg text-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center mt-12 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-serif text-lg md:text-xl italic text-muted-foreground">
            Um cenário pensado para quem quer espaço, imponência e{" "}
            <span className="text-primary font-semibold">um patrimônio realmente diferenciado</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MonacoNauticoSection;
