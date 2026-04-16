import { useEffect, useRef, useState } from "react";
import { Home, TrendingUp, Sparkles } from "lucide-react";

const profiles = [
  { icon: Home, title: "Para quem busca morar melhor:", benefit: "Mais espaço, mais segurança e mais qualidade de vida", color: "from-blue-500/20 to-blue-600/20" },
  { icon: TrendingUp, title: "Para quem pensa como investidor:", benefit: "Condomínios de alto padrão tendem a valorizar conforme a entrega se aproxima", color: "from-emerald-500/20 to-emerald-600/20" },
  { icon: Sparkles, title: "Para quem quer unir os dois:", benefit: "Um lugar para viver bem hoje e construir patrimônio amanhã", color: "from-amber-500/20 to-amber-600/20" },
];

const ALTargetSection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ESSE É O TIPO DE PROJETO{" "}
            <span className="text-gold-gradient">QUE VALORIZA</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {profiles.map((profile, index) => (
            <div
              key={profile.title}
              className={`relative group transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="card-luxury h-full flex flex-col items-center text-center p-8">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${profile.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <profile.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-4 text-foreground">{profile.title}</h3>
                <p className="text-muted-foreground leading-relaxed flex-1 flex items-start">
                  <span className="text-primary mr-2 shrink-0">👉</span>
                  {profile.benefit}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ALTargetSection;
