import { useEffect, useRef, useState } from "react";
import { Mountain, Leaf, Shield, Star, Building } from "lucide-react";

const features = [
  { icon: Building, label: "Alto Padrão" },
  { icon: Leaf, label: "Localização Privilegiada" },
  { icon: Shield, label: "Exclusividade" },
  { icon: Star, label: "Valorização" },
  { icon: Mountain, label: "Qualidade de Vida" },
];

const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section 
      id="sobre" 
      ref={sectionRef} 
      className="py-16 sm:py-20 md:py-32 bg-background relative overflow-hidden"
      aria-labelledby="about-title"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" aria-hidden="true" />

      <div className="container relative z-10 px-4">
        {/* Intro Text */}
        <div className={`max-w-4xl mx-auto text-center mb-12 sm:mb-16 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
            Estância Velha está se tornando um dos destinos mais desejados para quem busca empreendimentos de alto padrão no Vale dos Sinos. 
            A combinação de natureza preservada, infraestrutura em crescimento e localização estratégica torna cada lançamento uma oportunidade única.
          </p>
          
          <div className={`divider-gold mx-auto mb-6 sm:mb-8 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }} aria-hidden="true" />
          
          <p className={`text-base sm:text-lg text-foreground/80 italic font-serif ${isVisible ? 'animate-blur' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
            O mercado não espera. E as melhores unidades, menos ainda.
          </p>
          <p className={`text-sm sm:text-base text-muted-foreground mt-2 ${isVisible ? 'animate-blur' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
            Cadastre-se agora e tenha acesso privilegiado aos próximos lançamentos antes que se tornem públicos.
          </p>
        </div>

        {/* Main Section Title */}
        <header className={`text-center mb-12 sm:mb-16 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
          <h2 id="about-title" className="section-title mb-4 text-2xl sm:text-3xl md:text-4xl">
            Por que Estância Velha?{" "}
            <span className="text-primary">O Melhor está Por Vir.</span>
          </h2>
        </header>

        {/* Description */}
        <div className={`max-w-3xl mx-auto text-center mb-12 sm:mb-16 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-4 sm:mb-6">
            A região de Estância Velha combina o charme do interior com a conveniência da proximidade à capital. 
            Com novos empreendimentos sendo planejados por incorporadoras renomadas, a cidade se consolida como referência em qualidade de vida e potencial de valorização no Rio Grande do Sul.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Quem conhece o mercado imobiliário sabe: os melhores negócios acontecem antes do anúncio oficial. 
            Nosso cadastro de pré-lançamento garante que você seja informado primeiro.
          </p>
        </div>

        {/* CTA Button */}
        <div className={`text-center mb-16 sm:mb-20 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '700ms' }}>
          <button 
            onClick={scrollToForm} 
            className="btn-primary min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Cadastrar para acesso antecipado"
          >
            Quero Acesso Antecipado
          </button>
        </div>

        {/* Features Grid */}
        <aside className={`${isVisible ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '800ms' }}>
          <p className="text-center text-sm sm:text-base text-foreground/80 mb-8 sm:mb-10">
            Cada lançamento é selecionado com base em critérios rigorosos de:
          </p>
          
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6" role="list">
            {features.map((feature, index) => (
              <li 
                key={feature.label}
                className={`card-luxury text-center group ${isVisible ? 'animate-rotate-in' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100 + 900}ms` }}
              >
                <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" aria-hidden="true" />
                <p className="text-xs sm:text-sm font-medium text-foreground">{feature.label}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
};

export default AboutSection;
