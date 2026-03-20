import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import logoMonaco from "@/assets/monaco/logo-monaco.png";

const MonacoHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToContent = () => {
    document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(215,45%,6%)] via-[hsl(215,45%,10%)] to-[hsl(215,45%,6%)]" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(35,35%,50%)] to-transparent opacity-40" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,35%,50%)]/20 to-transparent" />

      <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <img src={logoMonaco} alt="Mônaco Grand Marina" className="h-20 sm:h-28 md:h-36 w-auto mx-auto mb-8" />

          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-[hsl(35,35%,50%)]/30 rounded-full bg-[hsl(35,35%,50%)]/8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[hsl(35,35%,55%)] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-[hsl(35,35%,60%)]">
              Condomínio Náutico de Alto Padrão
            </span>
          </div>

          <h1 className="font-serif text-[2.5rem] sm:text-[3.25rem] md:text-[4rem] lg:text-[4.75rem] font-black mb-6 text-white leading-[0.95]">
            LIBERDADE PARA<br />
            IR <span className="text-[hsl(35,35%,55%)]">ALÉM.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/65 mb-10 max-w-3xl mx-auto leading-relaxed">
            Conheça o Mônaco Grand Marina, um condomínio náutico de alto padrão na Lagoa dos Quadros, pensado para quem quer transformar moradia em estilo de vida.
          </p>

          <button
            onClick={scrollToForm}
            className="px-8 py-4 sm:px-10 sm:py-5 bg-[hsl(35,35%,45%)] hover:bg-[hsl(35,35%,38%)] text-white font-semibold uppercase tracking-[0.15em] text-sm sm:text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(35,35%,45%,0.25)]"
          >
            Quero Saber Mais
          </button>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-[hsl(35,35%,55%)] transition-colors animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};

export default MonacoHeroSection;
