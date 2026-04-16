import { useEffect, useRef, useState } from "react";
import { Waves, Dumbbell, Flame, PartyPopper, Trophy, Sparkles } from "lucide-react";

const amenities = [
  { icon: Waves, title: "Piscina indoor aquecida", desc: "Para usar o ano inteiro." },
  { icon: Waves, title: "Piscina adulto e infantil", desc: "Com raia e área kids." },
  { icon: Dumbbell, title: "Academia e ginástica", desc: "Equipamentos completos." },
  { icon: Flame, title: "Sauna e SPA", desc: "Bem-estar a poucos passos." },
  { icon: PartyPopper, title: "Salão de festas e gourmet", desc: "Para receber quem você ama." },
  { icon: Trophy, title: "Quadras esportivas", desc: "Futebol, tênis e beach tênis." },
];

const ALClubSection = () => {
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
    <section id="clube" ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            CLUBE COMPLETO DENTRO{" "}
            <span className="text-gold-gradient">DO SEU ENDEREÇO</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um padrão de lazer que normalmente exige deslocamento. Aqui, faz parte da sua rotina.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-12">
          {amenities.map((item, index) => (
            <div
              key={item.title}
              className={`card-luxury p-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-base md:text-lg font-semibold text-foreground mb-1">
                    <span className="text-primary mr-1">✔</span>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`max-w-3xl mx-auto text-center space-y-3 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Aqui, faz parte da sua rotina.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ALClubSection;
