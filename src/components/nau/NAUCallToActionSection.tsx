import { useEffect, useRef, useState } from "react";

const NAUCallToActionSection = () => {
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
      className="py-20 md:py-32 bg-[hsl(210,35%,6%)] relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(24,70%,42%)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(24,70%,42%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`mb-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Garanta um dos últimos lotes com{" "}
              <span className="text-[hsl(24,70%,50%)]">condição exclusiva</span>
            </h2>

            <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-6">
              As melhores oportunidades costumam desaparecer rápido quando unem localização, proposta e condição comercial no mesmo lugar.
            </p>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed">
              Se o Nau faz sentido para o que você quer viver, esse é o momento de entender disponibilidade, localização dos lotes e detalhes da condição.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <div className="w-20 h-px bg-[hsl(24,70%,42%)]/30 mx-auto mb-8" />
            <button
              onClick={scrollToForm}
              className="px-10 py-5 bg-[hsl(24,70%,42%)] hover:bg-[hsl(24,70%,36%)] text-white font-semibold uppercase tracking-[0.15em] text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(200,60%,40%,0.3)]"
            >
              Quero Garantir Meu Lote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUCallToActionSection;
