import { useEffect, useRef, useState } from "react";
import { Dumbbell, UtensilsCrossed, Sailboat, Waves, PartyPopper, Users } from "lucide-react";

const clubMarina = [
  { icon: Dumbbell, label: "Academia de 558 m²" },
  { icon: PartyPopper, label: "Salão de eventos de 606 m² (até 360 pessoas)" },
  { icon: Sailboat, label: "Garagens náuticas com guarderia automatizada" },
  { icon: Waves, label: "Atracadouro com 1.260 m² de píer" },
];

const clubLagoa = [
  "Restaurante e pool-bar",
  "Piscina aquecida, sauna seca e úmida",
  "Coffee/work e salão de festas",
  "Piscina de 2.320 m² com 65m de borda infinita",
  "Passarela de contemplação e ponte levadiça para veleiros",
];

const familyZones = [
  "Kids Zone", "Fun Zone", "Teen Zone", "Social Zone", "Family Zone com boliche",
];

const MonacoClubSection = () => {
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
      id="estrutura"
      ref={sectionRef}
      className="py-20 md:py-32 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ESTRUTURA DE ALTO PADRÃO PARA{" "}
            <span className="text-gold-gradient">VIVER, RECEBER E APROVEITAR</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            O Mônaco Grand Marina foi concebido para oferecer uma rotina marcada por exclusividade e bem-estar.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Clube da Marina */}
          <div className={`card-luxury transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h3 className="font-serif text-xl font-semibold mb-6 text-foreground">
              Clube da <span className="text-primary">Marina</span>
            </h3>
            <div className="space-y-4">
              {clubMarina.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground/85">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clube da Lagoa */}
          <div className={`card-luxury transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h3 className="font-serif text-xl font-semibold mb-2 text-foreground">
              Clube da <span className="text-primary">Lagoa</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-6">5.435 m² de área</p>
            <ul className="space-y-3">
              {clubLagoa.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary mr-1">✔</span>
                  <span className="text-foreground/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Family Zones */}
        <div className={`max-w-5xl mx-auto mt-8 card-luxury transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Espaços para cada fase da vida
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {familyZones.map((zone, i) => (
              <span
                key={i}
                className="px-4 py-2 text-sm text-foreground bg-background rounded-full border border-primary/30"
              >
                {zone}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground text-sm mt-4 italic">
            <span className="text-primary">👉</span> O Mônaco não é apenas um lugar para morar — é um lugar para pertencer.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MonacoClubSection;
