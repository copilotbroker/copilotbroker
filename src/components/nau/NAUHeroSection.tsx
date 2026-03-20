import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import heroEntrada from "@/assets/nau/nau-entrada.png";
import logoNau from "@/assets/nau/logo-nau.png";

const NAUHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = heroEntrada;
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
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundImage: `url(${heroEntrada})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210,35%,8%)]/90 via-[hsl(210,35%,8%)]/65 to-[hsl(210,35%,8%)]/90" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(24,70%,42%)] to-transparent opacity-50" />

      <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <img src={logoNau} alt="NAU Marina & Moradas" className="h-16 sm:h-20 md:h-24 w-auto mx-auto mb-6" />

          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[hsl(24,70%,42%)]/40 rounded-full bg-[hsl(24,70%,42%)]/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[hsl(24,70%,42%)] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-[hsl(24,70%,55%)]">
              Últimos Lotes com Condição Exclusiva
            </span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-white leading-[0.95]">
            O MARINA CLUB MAIS BELO<br />
            E <span className="text-[hsl(24,70%,50%)]">EXCLUSIVO</span> DO ESTADO.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Últimos lotes no Nau, o condomínio náutico em Osório para quem quer morar com exclusividade, liberdade e conexão real com a natureza.
          </p>


          <button
            onClick={scrollToForm}
            className="px-8 py-4 sm:px-10 sm:py-5 bg-[hsl(24,70%,42%)] hover:bg-[hsl(24,70%,36%)] text-white font-semibold uppercase tracking-[0.15em] text-sm sm:text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(200,60%,40%,0.3)]"
          >
            Quero Garantir Meu Lote
          </button>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-[hsl(24,70%,50%)] transition-colors animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};

export default NAUHeroSection;
