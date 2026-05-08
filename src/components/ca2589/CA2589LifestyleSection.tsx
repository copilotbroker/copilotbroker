import { useEffect, useRef, useState } from "react";
import { Dumbbell, Waves, Shield, TreePine, Tent, Trophy } from "lucide-react";

const amenities = [
  { icon: Dumbbell, title: "Academia & Fitness", items: "Sala fitness, sala de ginástica e espaço zen" },
  { icon: Waves, title: "Piscinas & Lazer", items: "Piscina adulto, infantil, deck molhado e hidromassagem" },
  { icon: Shield, title: "Segurança Total", items: "Portaria 24h, guarita blindada, CFTV e cerca elétrica" },
  { icon: TreePine, title: "Natureza & Ar Livre", items: "Bosque, jardim, lago, ciclovia e pet place" },
  { icon: Tent, title: "Convivência", items: "Salão de festas, churrasqueira, forno a lenha e espaço gourmet" },
  { icon: Trophy, title: "Esporte", items: "Quadra poliesportiva, tênis, campo de futebol e playground" },
];

const CA2589LifestyleSection = () => {
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
      className="py-20 md:py-32 bg-background relative overflow-hidden"
    >
      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            HORIZON CLUBE{" "}
            <span className="text-gold-gradient">RESIDENCIAL.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Muito mais que um condomínio — um clube completo para sua família.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {amenities.map((amenity, index) => (
            <div
              key={amenity.title}
              className={`card-luxury p-6 group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <amenity.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                    {amenity.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {amenity.items}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CA2589LifestyleSection;
