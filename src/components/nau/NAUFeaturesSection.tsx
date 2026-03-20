import { useEffect, useRef, useState } from "react";
import nauAerial from "@/assets/nau/nau-aerial.png";

const NAUFeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const imageObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => setImageLoaded(true);
          img.src = nauAerial;
          imageObserver.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    if (imageRef.current) imageObserver.observe(imageRef.current);
    return () => imageObserver.disconnect();
  }, []);

  return (
    <section
      id="diferenciais"
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[hsl(24,70%,42%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Mais do que um lote.{" "}
            <span className="text-[hsl(24,70%,50%)]">Um estilo de vida.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed">
              No Nau, cada detalhe do projeto convida você a imaginar uma vida com mais respiro, mais beleza e mais sentido. Um lugar para morar, desacelerar do caos e viver próximo à água, cercado por uma paisagem que muda a forma como você começa e termina o dia.
            </p>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed">
              Aqui, a escolha não é apenas sobre metragem ou localização.
            </p>

            <p className="font-serif text-xl md:text-2xl font-semibold text-white">
              É sobre o tipo de vida que você quer construir a partir de agora.
            </p>

            <div className="pt-4 px-6 py-4 border border-[hsl(24,70%,42%)]/20 rounded-lg bg-[hsl(24,70%,42%)]/5 text-center">
              <p className="text-sm text-[hsl(24,70%,50%)] uppercase tracking-wider mb-1">Previsão de entrega</p>
              <p className="text-xl font-semibold text-white">Outubro de 2026</p>
            </div>
          </div>

          <div
            ref={imageRef}
            className={`relative transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <div className={`aspect-[4/3] bg-[hsl(210,35%,12%)] transition-opacity duration-500 ${imageLoaded ? "opacity-0" : "opacity-100"}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-[hsl(24,70%,42%)] border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              {imageLoaded && (
                <img
                  src={nauAerial}
                  alt="Vista aérea do NAU com canal navegável e lotes"
                  className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,35%,8%)]/40 to-transparent" />
            </div>
            <div className="absolute -inset-2 border border-[hsl(24,70%,42%)]/20 rounded-lg -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUFeaturesSection;
