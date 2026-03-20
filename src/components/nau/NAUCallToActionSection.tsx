import { useEffect, useRef, useState } from "react";
import { Anchor, Waves, ShieldCheck, MapPin } from "lucide-react";

const features = [
  { icon: Anchor, text: "Lotes navegáveis" },
  { icon: Waves, text: "Acesso à lagoa" },
  { icon: ShieldCheck, text: "Condomínio fechado" },
  { icon: MapPin, text: "Osório - RS" },
];

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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(200,60%,40%)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(200,60%,40%)]/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              VOCÊ VAI{" "}
              <span className="text-[hsl(200,60%,55%)]">NAVEGAR OU ASSISTIR?</span>
            </h2>

            <p className="text-lg text-white/60 mb-8">Um condomínio com:</p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={feature.text}
                  className={`flex items-center gap-2 px-4 py-2 bg-[hsl(210,35%,10%)] rounded-full border border-[hsl(200,60%,40%)]/30 transition-all duration-500 ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <feature.icon className="w-4 h-4 text-[hsl(200,60%,55%)]" />
                  <span className="text-sm font-medium text-white/90">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`mb-12 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-white/60 mb-4">Daqui a pouco, você vai ouvir:</p>
            <p className="font-serif text-2xl md:text-3xl italic text-white mb-8">"Eu quase comprei um lote no NAU."</p>

            <div className="space-y-2">
              <p className="text-white/50 line-through">Quase não garante lote navegável.</p>
              <p className="text-white/50 line-through">Quase não dá desconto de 25%.</p>
              <p className="font-serif text-xl font-semibold text-red-400">Quase não vale nada.</p>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <div className="w-20 h-px bg-[hsl(200,60%,40%)]/30 mx-auto mb-8" />
            <p className="font-serif text-xl md:text-2xl font-semibold text-white mb-8">
              Você vai garantir o seu ou vai assistir outros garantirem?
            </p>
            <button
              onClick={scrollToForm}
              className="px-10 py-5 bg-[hsl(200,60%,40%)] hover:bg-[hsl(200,60%,35%)] text-white font-semibold uppercase tracking-[0.15em] text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(200,60%,40%,0.3)]"
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
