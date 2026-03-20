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
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(215,45%,5%)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(35,35%,50%)]/3 via-transparent to-[hsl(35,35%,50%)]/3" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight">
            Estrutura de alto padrão para{" "}
            <span className="text-[hsl(35,35%,55%)]">viver, receber e aproveitar</span>
          </h2>
          <p className="text-base sm:text-lg text-white/60 max-w-3xl mx-auto">
            O Mônaco Grand Marina foi concebido para oferecer uma rotina marcada por exclusividade e bem-estar.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Clube da Marina */}
          <div className={`p-8 rounded-xl bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/15 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h3 className="font-serif text-2xl font-bold text-white mb-6">
              Clube da <span className="text-[hsl(35,35%,55%)]">Marina</span>
            </h3>
            <div className="space-y-4">
              {clubMarina.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(35,35%,50%)]/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[hsl(35,35%,55%)]" />
                  </div>
                  <span className="text-white/85">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clube da Lagoa */}
          <div className={`p-8 rounded-xl bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/15 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">
              Clube da <span className="text-[hsl(35,35%,55%)]">Lagoa</span>
            </h3>
            <p className="text-sm text-white/50 mb-6">5.435 m² de área</p>
            <ul className="space-y-3">
              {clubLagoa.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[hsl(35,35%,55%)] shrink-0" />
                  <span className="text-white/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Family Zones */}
        <div className={`max-w-5xl mx-auto mt-8 p-6 rounded-xl bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/15 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[hsl(35,35%,55%)]" />
            <h3 className="font-serif text-xl font-bold text-white">
              Espaços para cada fase da vida
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {familyZones.map((zone, i) => (
              <span
                key={i}
                className="px-4 py-2 text-sm text-white/80 bg-[hsl(35,35%,50%)]/8 border border-[hsl(35,35%,50%)]/15 rounded-full"
              >
                {zone}
              </span>
            ))}
          </div>
          <p className="text-white/60 text-sm mt-4 italic">
            O Mônaco não é apenas um lugar para morar — é um lugar para pertencer.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MonacoClubSection;
