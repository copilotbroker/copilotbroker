import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import logoMonaco from "@/assets/monaco/logo-monaco.png";
import heroBg from "@/assets/monaco/hero-monaco.jpg";

const MonacoHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = heroBg;
    setIsVisible(true);
  }, []);

  const scrollToContent = () => {
    document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        role="img"
        aria-label="Vista do Mônaco Grand Marina com piscina e lagoa"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />

      <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <img src={logoMonaco} alt="Mônaco Grand Marina" className="h-20 sm:h-28 md:h-36 w-auto mx-auto mb-8 brightness-0 invert" />

          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-primary/40 rounded-full bg-primary/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-primary">
              Condomínio Náutico de Alto Padrão
            </span>
          </div>

          <h1
            id="hero-heading"
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white leading-[1.05]"
          >
            LIBERDADE<br />
            PARA IR <span className="text-gold-gradient">ALÉM.</span>
          </h1>

          <div className="w-16 h-px bg-primary/50 mx-auto mb-8" />

          <p className="text-sm sm:text-base text-white/70 mb-10 max-w-2xl mx-auto">
            Conheça o Mônaco Grand Marina, um condomínio náutico de alto padrão na Lagoa dos Quadros, pensado para quem quer transformar moradia em estilo de vida.
          </p>

          <button
            onClick={scrollToForm}
            className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5"
            aria-label="Quero saber mais sobre o empreendimento"
          >
            Quero Saber Mais
          </button>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-primary transition-colors animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};

export default MonacoHeroSection;
