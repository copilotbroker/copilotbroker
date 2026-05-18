import { useEffect, useRef, useState } from "react";
import { Gem, MapPin, Ruler, ShieldCheck, TrendingUp, Eye } from "lucide-react";

const features = [
  { icon: Gem, title: "Empreendimentos de alto padrão" },
  { icon: MapPin, title: "Localizações estratégicas e privilegiadas" },
  { icon: Ruler, title: "Unidades com metragens diferenciadas" },
  { icon: ShieldCheck, title: "Condições exclusivas de pré-lançamento" },
  { icon: TrendingUp, title: "Alto potencial de valorização" },
  { icon: Eye, title: "Acesso antes da divulgação oficial" },
];

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="py-16 sm:py-20 md:py-32 bg-secondary/30 relative overflow-hidden"
      aria-labelledby="features-title"
    >
      {/* Decorative Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
      
      <div className="container relative z-10 px-4">
        <header className={`text-center mb-12 sm:mb-16 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
          <h2 id="features-title" className="section-title mb-4 text-2xl sm:text-3xl md:text-4xl">
            O Que Você Recebe ao{" "}
            <span className="text-primary">Se Cadastrar</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto text-sm sm:text-base">
            Nosso compromisso é conectar você às melhores oportunidades do mercado imobiliário de Estância Velha:
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16" role="list">
          {features.map((feature, index) => (
            <li
              key={feature.title}
              className={`card-luxury flex items-center gap-3 sm:gap-4 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" aria-hidden="true" />
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">{feature.title}</p>
            </li>
          ))}
        </ul>

        {/* Additional Info */}
        <aside className={`text-center max-w-2xl mx-auto ${isVisible ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6 animate-glow">
            <span className="text-xl sm:text-2xl" role="img" aria-label="Cadeado indicando exclusividade">🔒</span>
          </div>
          <p className="text-lg sm:text-xl text-foreground/90 font-medium mb-2">
            Informações restritas e privilegiadas
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            Os detalhes de cada lançamento são compartilhados primeiro com quem está cadastrado. Depois, com todo mundo.
          </p>
        </aside>
      </div>
      
      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
    </section>
  );
};

export default FeaturesSection;
