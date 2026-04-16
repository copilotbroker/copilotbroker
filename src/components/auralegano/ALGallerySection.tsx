import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import img1 from "@/assets/auralegano/gallery/piscina-externa-1.webp";
import img2 from "@/assets/auralegano/gallery/piscina-externa-2.webp";
import img3 from "@/assets/auralegano/gallery/clube-social-1.webp";
import img4 from "@/assets/auralegano/gallery/clube-social-2.jpg";
import img5 from "@/assets/auralegano/gallery/implantacao.webp";
import img6 from "@/assets/auralegano/gallery/clube-social-3.webp";
import img7 from "@/assets/auralegano/gallery/quincho.webp";
import img8 from "@/assets/auralegano/gallery/vista-pier.webp";
import img9 from "@/assets/auralegano/gallery/complexo-esportivo.webp";

const slides = [
  { src: img1, caption: "Piscina externa" },
  { src: img2, caption: "Piscina externa" },
  { src: img3, caption: "Clube social" },
  { src: img4, caption: "Clube social" },
  { src: img5, caption: "Perspectiva da implantação" },
  { src: img6, caption: "Clube social" },
  { src: img7, caption: "Quincho" },
  { src: img8, caption: "Vista do pier" },
  { src: img9, caption: "Complexo esportivo" },
];

const ALGallerySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i === null ? null : (i - 1 + slides.length) % slides.length));
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : (i + 1) % slides.length));
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  return (
    <section
      id="galeria"
      ref={sectionRef}
      className="py-20 md:py-32 bg-background relative overflow-hidden"
    >
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            Galeria
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            CONHEÇA O <span className="text-gold-gradient">AURA LEGANO</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Um condomínio fechado de alto padrão que une a tranquilidade da natureza à estrutura completa do bairro cidade Legano.
          </p>
        </div>

        <div
          className={`relative max-w-6xl mx-auto transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Carousel
            setApi={setApi}
            opts={{ loop: true, align: "start" }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {slides.map((slide, idx) => (
                <CarouselItem key={idx} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative block w-full overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all hover:border-primary/40"
                    aria-label={`Ampliar imagem: ${slide.caption}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={slide.src}
                        alt={slide.caption}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                        <span className="text-white font-medium text-sm md:text-base">
                          {slide.caption}
                        </span>
                      </div>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Custom arrows */}
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label="Imagem anterior"
            className="hidden sm:flex absolute -left-4 lg:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label="Próxima imagem"
            className="hidden sm:flex absolute -right-4 lg:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => api?.scrollTo(idx)}
                aria-label={`Ir para imagem ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  current === idx ? "w-8 bg-primary" : "w-1.5 bg-primary/30"
                }`}
              />
            ))}
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 italic">
            <span className="text-primary">👉</span> Toque em uma imagem para ampliar.
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de imagens"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i === null ? null : (i - 1 + slides.length) % slides.length));
            }}
            aria-label="Imagem anterior"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i === null ? null : (i + 1) % slides.length));
            }}
            aria-label="Próxima imagem"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={slides[lightboxIndex].src}
              alt={slides[lightboxIndex].caption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium text-base">
                {slides[lightboxIndex].caption}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {lightboxIndex + 1} / {slides.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ALGallerySection;
