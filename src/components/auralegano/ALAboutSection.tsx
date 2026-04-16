import { useEffect, useRef, useState } from "react";
import { Hammer, Lock, ShieldCheck } from "lucide-react";

const items = [
  { icon: Hammer, text: "Liberdade para construir do seu jeito" },
  { icon: Lock, text: "Privacidade dentro de um condomínio fechado" },
  { icon: ShieldCheck, text: "Segurança e qualidade de vida no dia a dia" },
];

const ALAboutSection = () => {
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
    <section id="projeto" ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            VOCÊ NÃO ESTÁ COMPRANDO{" "}
            <span className="text-gold-gradient">UM TERRENO</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground mb-12 leading-relaxed">
            Está garantindo presença em um dos projetos mais completos da região.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {items.map((item, index) => (
              <div
                key={item.text}
                className={`card-luxury p-6 text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm sm:text-base text-foreground">
                  <span className="text-primary mr-1">✔</span>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className={`space-y-4 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <span className="text-primary">👉</span>
              Aqui, você não se adapta a um imóvel.
            </p>
            <div className="divider-gold mx-auto my-6" />
            <p className="font-serif text-xl md:text-2xl italic text-foreground">
              Você constrói exatamente
            </p>
            <p className="font-serif text-xl md:text-2xl font-semibold text-primary">
              o que quer viver.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ALAboutSection;
