import { useEffect, useRef, useState } from "react";

const NAUTargetSection = () => {
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
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-[hsl(24,70%,42%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Por que o Nau é{" "}
              <span className="text-[hsl(24,70%,50%)]">diferente?</span>
            </h2>
          </div>

          <div className={`space-y-8 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="p-6 rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(24,70%,42%)]/10">
              <p className="text-white/80 leading-relaxed">
                Porque ele não entrega apenas um terreno.<br />
                <strong className="text-white">Entrega cenário, exclusividade e uma forma mais inteligente de morar.</strong>
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(24,70%,42%)]/10">
              <p className="text-white/80 leading-relaxed">
                Porque viver perto da água muda a experiência da rotina.<br />
                E porque condomínios com acesso à lagoa e proposta residencial carregam um <strong className="text-white">valor percebido muito acima do comum</strong>.
              </p>
            </div>

            <div className={`text-center pt-4 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100" : "opacity-0"}`}>
              <p className="font-serif text-xl md:text-2xl text-white leading-relaxed">
                O Nau é para quem não quer apenas comprar um lote.<br />
                <span className="text-[hsl(24,70%,50%)]">Quer escolher bem onde vai viver os próximos anos da própria história.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUTargetSection;
