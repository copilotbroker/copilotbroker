import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import heroAerial from "@/assets/nau/hero-aerial.jpg";

const NAUHeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = heroAerial;
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
        style={{ backgroundImage: `url(${heroAerial})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210,35%,8%)]/80 via-[hsl(210,35%,8%)]/50 to-[hsl(210,35%,8%)]/85" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(200,60%,40%)] to-transparent opacity-50" />

      <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[hsl(200,60%,40%)]/40 rounded-full bg-[hsl(200,60%,40%)]/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[hsl(200,60%,40%)] animate-pulse" />
            <span className="text-xs sm:text-sm font-medium tracking-widest uppercase text-[hsl(200,60%,60%)]">
              Últimos Lotes com Condição Exclusiva
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-[1.1]">
            VIVA À BEIRA DA{" "}
            <span className="text-[hsl(200,60%,55%)]">LAGOA</span>.{" "}
            COM LOTE NAVEGÁVEL A PARTIR DE{" "}
            <span className="text-[hsl(200,60%,55%)]">R$ 229 MIL</span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl font-serif italic text-[hsl(200,60%,55%)] mb-6">
            Entrega em Outubro de 2026.
          </p>

          <p className="text-sm sm:text-base text-white/70 mb-8 max-w-2xl mx-auto">
            O NAU é um condomínio náutico em Osório com acesso direto à Lagoa do Peixoto. 390.000 m² de área total com lotes navegáveis, secos e beira lago.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="px-6 py-3 border border-[hsl(200,60%,40%)]/30 rounded-lg bg-[hsl(200,60%,40%)]/10 backdrop-blur-sm">
              <p className="text-xs text-[hsl(200,60%,60%)] uppercase tracking-wider mb-1">Condição Curta</p>
              <p className="text-white font-semibold">25% de desconto · 30x sem juros</p>
            </div>
          </div>

          <button
            onClick={scrollToForm}
            className="px-8 py-4 sm:px-10 sm:py-5 bg-[hsl(200,60%,40%)] hover:bg-[hsl(200,60%,35%)] text-white font-semibold uppercase tracking-[0.15em] text-sm sm:text-base transition-all duration-300 rounded hover:shadow-[0_10px_40px_hsl(200,60%,40%,0.3)]"
          >
            Quero Garantir Meu Lote
          </button>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-[hsl(200,60%,55%)] transition-colors animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};

export default NAUHeroSection;
