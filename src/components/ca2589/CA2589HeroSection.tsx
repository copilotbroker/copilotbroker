import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const HERO_IMG = "https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg";

const CA2589HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = HERO_IMG;
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
      className="relative min-h-[90vh] sm:min-h-screen flex items-start justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}
        role="img"
        aria-label="Vista frontal da casa no Horizon Clube Residencial"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-background" />

      <div className="relative z-10 container px-4 pt-32 sm:pt-40 md:pt-48 pb-16 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 border border-primary/40 rounded-full bg-primary/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-primary">
              Horizon Clube Residencial
            </span>
          </div>

          <h1
            id="hero-heading"
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-3 text-white leading-[0.95]"
          >
            SOFISTICAÇÃO<br />
            QUE <span className="text-gold-gradient">INSPIRA.</span>
          </h1>

          <div className="w-16 h-px bg-primary/50 mx-auto mb-4" />

          <p className="text-sm sm:text-base text-white/70 mb-6 max-w-2xl mx-auto">
            323m² de elegância e conforto em uma das casas mais exclusivas de Estância Velha.
            4 suítes, piscina aquecida, energia solar e vista para o pôr do sol.
          </p>

          <a
            href="#sobre"
            className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5 inline-block"
            aria-label="Quero conhecer este imóvel"
          >
            Quero Conhecer
          </a>
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

export default CA2589HeroSection;
