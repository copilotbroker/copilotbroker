import { useEffect, useRef, useState } from "react";

const ABOUT_IMG = "https://flip-prod-fotos.s3.amazonaws.com/f59bfe48-ffc9-4cbb-add5-d4be0e0e8da1.jpeg";

const CA2727AboutSection = () => {
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
      className="py-20 md:py-32 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${ABOUT_IMG})` }}
      />
      <div className="absolute inset-0 bg-background/88" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            UMA CASA QUE{" "}
            <span className="text-gold-gradient">CONTA HISTÓRIAS.</span>
          </h2>

          <p className="font-serif text-xl md:text-2xl italic text-muted-foreground mb-8 leading-relaxed">
            Existem imóveis que oferecem espaço.
            E existem residências que oferecem uma experiência de vida.
          </p>

          <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">
            Com <strong className="text-foreground">372m² de área construída</strong> sobre um terreno de 400m², esta casa combina 
            sofisticação, conforto e tecnologia no coração do <strong className="text-foreground">Condomínio Horizon Clube Residencial</strong>, 
            em Estância Velha.
          </p>

          <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
            São <strong className="text-foreground">3 suítes amplas</strong>, lavabo, sala de estar com lareira e ambientes de 
            cozinha e jantar integrados. A área externa é um convite ao lazer: varanda gourmet com churrasqueira, piscina e uma 
            <strong className="text-foreground"> vista deslumbrante para o pôr do sol</strong>, com frente para área verde.
          </p>

          <div className="divider-gold mx-auto my-8" />

          <p className="font-serif text-xl md:text-2xl font-semibold text-foreground">
            Automação completa, energia solar fotovoltaica
          </p>
          <p className="font-serif text-xl md:text-2xl font-semibold text-primary">
            e um cenário inesquecível todos os dias.
          </p>

          <div className="mt-12 rounded-lg overflow-hidden shadow-2xl">
            <img
              src={ABOUT_IMG}
              alt="Interior da casa no Horizon Clube Residencial"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CA2727AboutSection;
