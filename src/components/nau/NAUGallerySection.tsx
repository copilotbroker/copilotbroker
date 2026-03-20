import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import nauClubhouse from "@/assets/nau/nau-clubhouse.png";
import nauLounge from "@/assets/nau/nau-lounge.png";
import nauBeachTennis from "@/assets/nau/nau-beach-tennis.png";
import nauRua from "@/assets/nau/nau-rua.png";
import nauMarina from "@/assets/nau/nau-marina.png";
import nauCasaLago from "@/assets/nau/nau-casa-lago.png";

const slides = [
  { src: nauCasaLago, alt: "Casa de alto padrão com lancha atracada na lagoa", caption: "Lotes navegáveis com acesso direto à água" },
  { src: nauMarina, alt: "Marina privativa do NAU com deck de madeira", caption: "Marina privativa para moradores" },
  { src: nauClubhouse, alt: "Clubhouse do condomínio NAU com convivência", caption: "Espaço de convivência e clube social" },
  { src: nauLounge, alt: "Lounge interno com design contemporâneo", caption: "Arquitetura que valoriza o encontro" },
  { src: nauBeachTennis, alt: "Quadras de beach tennis com vista para a lagoa", caption: "Esporte e lazer junto à natureza" },
  { src: nauRua, alt: "Rua interna do condomínio com casas de alto padrão", caption: "Infraestrutura completa e paisagismo" },
];

const NAUGallerySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [next]);

  const goTo = (i: number) => {
    setCurrent(i);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 5000);
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,6%)] relative overflow-hidden"
    >
      <div className="container px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            Conheça o <span className="text-[hsl(24,70%,50%)]">NAU</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Cada espaço foi pensado para transformar o dia a dia em uma experiência à parte.
          </p>
        </div>

        <div className={`relative max-w-5xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
            {slides.map((slide, i) => (
              <img
                key={i}
                src={slide.src}
                alt={slide.alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,35%,8%)]/70 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
              <p className="text-white text-sm sm:text-base font-medium drop-shadow-lg">
                {slides[current].caption}
              </p>
            </div>

            <button onClick={() => { prev(); clearInterval(intervalRef.current); intervalRef.current = setInterval(next, 5000); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => { next(); clearInterval(intervalRef.current); intervalRef.current = setInterval(next, 5000); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-[hsl(24,70%,50%)]" : "bg-white/30 hover:bg-white/50"}`}
                aria-label={`Ir para imagem ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUGallerySection;
