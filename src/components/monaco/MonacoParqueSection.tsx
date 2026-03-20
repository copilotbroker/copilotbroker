import { useEffect, useRef, useState } from "react";
import { TreePine, Bike, Volleyball, Anchor, Sun, Car } from "lucide-react";

const features = [
  { icon: TreePine, label: "13.150 m² de área total" },
  { icon: Sun, label: "550 metros de praia natural" },
  { icon: Bike, label: "Pista de caminhada e ciclovia" },
  { icon: Volleyball, label: "Quadras de beach tennis" },
  { icon: Anchor, label: "Atracadouro, deck e farol" },
  { icon: Car, label: "Serviço de praia e estacionamento" },
];

const MonacoParqueSection = () => {
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
      className="py-20 md:py-32 bg-[hsl(215,45%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-[hsl(35,35%,50%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
            Parque da <span className="text-[hsl(35,35%,55%)]">Orla</span>
          </h2>
          <p className="text-base sm:text-lg text-white/65 max-w-3xl mx-auto leading-relaxed">
            Um parque à beira da lagoa para contemplar, viver e se mover. Uma estrutura completa para quem quer viver o lado mais sofisticado do lazer ao ar livre.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-5 rounded-lg bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/10 hover:border-[hsl(35,35%,50%)]/30 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="w-11 h-11 shrink-0 rounded-full bg-[hsl(35,35%,50%)]/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[hsl(35,35%,55%)]" />
              </div>
              <p className="text-sm text-white/90 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MonacoParqueSection;
