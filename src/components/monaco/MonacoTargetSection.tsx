import { useEffect, useRef, useState } from "react";

const MonacoTargetSection = () => {
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

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(215,45%,6%)] relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(35,35%,50%)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(35,35%,50%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`mb-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white leading-tight">
              Para quem o Mônaco foi{" "}
              <span className="text-[hsl(35,35%,55%)]">pensado</span>
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-white/70 leading-relaxed">
              <p>Para quem deseja morar em um endereço que entrega mais do que metragem.</p>
              <p>Para quem valoriza água, natureza, arquitetura e conveniência.</p>
              <p className="font-serif text-xl md:text-2xl font-semibold text-white pt-2">
                Para quem quer sair do óbvio e construir em um lugar com <span className="text-[hsl(35,35%,55%)]">presença, exclusividade e significado</span>.
              </p>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <div className="w-20 h-px bg-[hsl(35,35%,50%)]/30 mx-auto mb-8" />
            <button
              onClick={scrollToForm}
              className="px-10 py-5 bg-[hsl(35,35%,45%)] hover:bg-[hsl(35,35%,38%)] text-white font-semibold uppercase tracking-[0.15em] text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(35,35%,45%,0.25)]"
            >
              Quero Saber Mais
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MonacoTargetSection;
