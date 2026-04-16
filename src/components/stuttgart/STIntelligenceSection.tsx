import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Briefcase, Users, TrendingUp } from "lucide-react";

const pillars = [
  { icon: ShieldCheck, title: "Segurança", desc: "Condomínio fechado para tranquilidade da sua família" },
  { icon: Briefcase, title: "Praticidade", desc: "Trabalhe no seu próprio condomínio com coworking completo" },
  { icon: Users, title: "Convívio", desc: "Ambientes que aproximam pessoas e criam experiências" },
  { icon: TrendingUp, title: "Valorização", desc: "Empreendimentos com lazer completo são cada vez mais desejados" },
];

const STIntelligenceSection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            MAIS DO QUE CONFORTO.{" "}
            <span className="text-gold-gradient">INTELIGÊNCIA DE VIDA</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pillars.map((p, index) => (
            <div
              key={p.title}
              className={`card-luxury h-full flex flex-col items-center text-center p-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className={`mt-12 max-w-3xl mx-auto text-center space-y-3 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-muted-foreground"><span className="text-primary">👉</span> Você não compra só um imóvel.</p>
          <p className="font-serif text-xl text-primary">👉 Você entra em um estilo de vida.</p>
        </div>
      </div>
    </section>
  );
};

export default STIntelligenceSection;
