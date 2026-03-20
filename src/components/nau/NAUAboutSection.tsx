import { useEffect, useRef, useState } from "react";
import { Anchor, Waves, TreePine, Home, Maximize } from "lucide-react";

const highlights = [
  { icon: Anchor, text: "Lotes navegáveis com acesso direto à lagoa" },
  { icon: Waves, text: "Lotes beira lago com vista permanente" },
  { icon: TreePine, text: "Lotes secos em meio à natureza preservada" },
  { icon Home, text: "Projetado para moradia, não apenas lazer" },
  { icon: Maximize, text: "390.000 m² de área total" },
];

const NAUAboutSection = () => {
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
      id="sobre"
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,6%)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(200,60%,40%)]/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            O ÚNICO CONDOMÍNIO NÁUTICO{" "}
            <span className="text-[hsl(200,60%,55%)]">COM ACESSO À LAGOA DO PEIXOTO</span>
          </h2>
          <p className="text-lg text-white/60 max-w-3xl mx-auto">
            Localizado em Osório - RS, o NAU oferece uma experiência de moradia incomparável: sua casa com píer privativo, barco na porta e a lagoa como quintal.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {highlights.map((item, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 p-5 rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(200,60%,40%)]/10 hover:border-[hsl(200,60%,40%)]/30 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-[hsl(200,60%,40%)]/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-[hsl(200,60%,55%)]" />
              </div>
              <p className="text-base text-white/90 pt-3">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NAUAboutSection;
