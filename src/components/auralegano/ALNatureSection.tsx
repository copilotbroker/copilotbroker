import { useEffect, useRef, useState } from "react";
import { Trees, Mountain } from "lucide-react";

const linear = [
  "Trilhas para caminhada",
  "Espaços de piquenique",
  "Mirante de observação",
];

const arvores = [
  "Espaço zen",
  "Quinchos estilo uruguaio",
  "Fire pits ao ar livre",
  "Playground",
];

const ALNatureSection = () => {
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
    <section id="natureza" ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            NATUREZA INTEGRADA{" "}
            <span className="text-gold-gradient">AO DIA A DIA</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          <div
            className={`card-luxury p-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Trees className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground">Parque Linear</h3>
            </div>
            <ul className="space-y-3">
              {linear.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <span className="text-primary">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`card-luxury p-8 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mountain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground">Parque das Árvores</h3>
            </div>
            <ul className="space-y-3">
              {arvores.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <span className="text-primary">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-serif text-lg md:text-xl italic text-muted-foreground">
            <span className="text-primary">👉</span> Um ambiente pensado para desacelerar sem sair de casa.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ALNatureSection;
