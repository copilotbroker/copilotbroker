import { useEffect, useRef, useState } from "react";
import { Home } from "lucide-react";

const plants = [
  "2 dormitórios com suíte",
  "2 dormitórios com suíte e garden",
  "3 dormitórios com suíte",
  "3 dormitórios com suíte e garden",
  "Coberturas",
  "Duplex com 3 dormitórios",
];

const STPlantsSection = () => {
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
    <section id="plantas" ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            PLANTAS PARA{" "}
            <span className="text-gold-gradient">DIFERENTES MOMENTOS DA VIDA</span>
          </h2>
          <p className="text-muted-foreground">Escolha o espaço que faz sentido para você:</p>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4">
          {plants.map((plant, index) => (
            <div
              key={plant}
              className={`flex items-center gap-4 p-5 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <span className="text-foreground">
                <span className="text-primary mr-2">✔</span>
                {plant}
              </span>
            </div>
          ))}
        </div>

        <div className={`mt-10 text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-serif text-lg md:text-xl italic text-muted-foreground">
            <span className="text-primary">👉</span> Ambientes inteligentes, pensados para o seu dia a dia.
          </p>
        </div>
      </div>
    </section>
  );
};

export default STPlantsSection;
