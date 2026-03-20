import { useEffect, useRef, useState } from "react";

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
      className="py-20 md:py-32 bg-[hsl(215,45%,5%)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,35%,50%)]/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <p className="font-serif text-2xl sm:text-3xl md:text-4xl italic text-[hsl(35,35%,55%)] mb-8 leading-snug">
            Existem empreendimentos que entregam estrutura.<br />
            E existem projetos que entregam uma nova forma de viver.
          </p>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-6">
            O Mônaco Grand Marina nasce com essa proposta: unir natureza, sofisticação, mobilidade e experiência náutica em um endereço raro, estrategicamente posicionado na Lagoa dos Quadros, ao lado do aeródromo privado D1 Fly e a apenas 5 minutos da Estrada do Mar e do Centro de Atlântida.
          </p>

          <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-6">
            Aqui, chegar com facilidade é apenas o começo.
          </p>

          <p className="font-serif text-xl md:text-2xl font-semibold text-white">
            Porque o verdadeiro privilégio está em viver em um lugar onde o horizonte deixa de ser limite e passa a ser <span className="text-[hsl(35,35%,55%)]">convite</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MonacoAboutSection;
