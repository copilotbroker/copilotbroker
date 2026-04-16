import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import predioImage from "@/assets/stuttgart/fachada.webp";

const STHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = predioImage;
    setIsVisible(true);
  }, []);

  const scrollToContent = () => {
    document.getElementById("novo-jeito")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" aria-labelledby="hero-heading">
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundImage: `url(${predioImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        role="img"
        aria-label="Fachada do Residencial Jardins de Stuttgart em Ivoti"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-primary/40 rounded-full bg-primary/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-primary">
              Lançamento · Obras em Andamento
            </span>
          </div>

          <h1 id="hero-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight">
            VOCÊ NÃO PRECISA MAIS{" "}
            <span className="text-gold-gradient">SAIR DE CASA PARA VIVER BEM</span>
          </h1>

          <div className="w-16 h-px bg-primary/50 mx-auto mb-8" />

          <p className="text-sm sm:text-base text-white/80 mb-3 max-w-2xl mx-auto">
            Em Ivoti, surge um residencial que redefine o conceito de qualidade de vida.
          </p>
          <p className="text-base sm:text-lg text-white font-serif italic mb-10 max-w-2xl mx-auto">
            Residencial Jardins de Stuttgart
          </p>

          <button
            onClick={scrollToForm}
            className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5"
            aria-label="Quero conhecer as unidades disponíveis"
          >
            Quero Conhecer as Unidades
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

export default STHeroSection;
