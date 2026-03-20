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
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(215,45%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[hsl(35,35%,50%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
            Um condomínio náutico onde a água{" "}
            <span className="text-[hsl(35,35%,55%)]">faz parte da vida</span>
          </h2>
          <p className="text-base sm:text-lg text-white/65 max-w-3xl mx-auto leading-relaxed">
            No Mônaco, os canais navegáveis conectam lagos, marina e residências com fluidez e segurança, criando uma experiência única para quem valoriza liberdade real.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {highlights.map((item, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 p-5 rounded-lg bg-[hsl(215,45%,10%)] border border-[hsl(35,35%,50%)]/10 hover:border-[hsl(35,35%,50%)]/30 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-[hsl(35,35%,50%)]/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-[hsl(35,35%,55%)]" />
              </div>
              <p className="text-base text-white/90 pt-3">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MonacoNauticoSection;
