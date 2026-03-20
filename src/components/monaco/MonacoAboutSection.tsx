import { useEffect, useRef, useState } from "react";
import aviaoImg from "@/assets/monaco/monaco-aviao.jpg";

const MonacoAboutSection = () => {
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
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-[70%_center] sm:bg-center"
        style={{ backgroundImage: `url(${aviaoImg})` }}
      />
      <div className="absolute inset-0 bg-background/85" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            O ENDEREÇO{" "}
            <span className="text-gold-gradient">FALA POR SI.</span>
          </h2>

          <p className="font-serif text-xl md:text-2xl italic text-muted-foreground mb-8 leading-relaxed">
            Existem empreendimentos que entregam estrutura.
            E existem projetos que entregam uma nova forma de viver.
          </p>

          <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
            O Mônaco Grand Marina nasce com essa proposta: unir natureza, sofisticação, mobilidade e experiência náutica em um endereço raro, estrategicamente posicionado na <strong className="text-foreground">Lagoa dos Quadros</strong> — o primeiro condomínio do litoral com aeródromo privativo, o <strong className="text-foreground">D1 Fly</strong>, e a apenas 5 minutos da Estrada do Mar e do Centro de Atlântida.
          </p>

          <div className="divider-gold mx-auto my-8" />

          <p className="font-serif text-xl md:text-2xl font-semibold text-foreground">
            O verdadeiro privilégio está em viver onde o horizonte deixa de ser limite
          </p>
          <p className="font-serif text-xl md:text-2xl font-semibold text-primary">
            e passa a ser convite.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MonacoAboutSection;
