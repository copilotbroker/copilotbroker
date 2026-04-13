import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const GALLERY_IMAGES = [
  { src: "https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg", alt: "Vista frontal da casa no Horizon Clube Residencial" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f59bfe48-ffc9-4cbb-add5-d4be0e0e8da1.jpeg", alt: "Interior da casa no Horizon Clube Residencial" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/cb25fb26-3d1f-4082-832d-94cc17844129.jpeg", alt: "Detalhe da casa no Horizon Clube Residencial" },
];

const CA2727AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const prev = useCallback(() => setCurrent(c => (c === 0 ? GALLERY_IMAGES.length - 1 : c - 1)), []);
  const next = useCallback(() => setCurrent(c => (c === GALLERY_IMAGES.length - 1 ? 0 : c + 1)), []);

  const lightboxPrev = useCallback(() => setLightboxIndex(c => (c === 0 ? GALLERY_IMAGES.length - 1 : c - 1)), []);
  const lightboxNext = useCallback(() => setLightboxIndex(c => (c === GALLERY_IMAGES.length - 1 ? 0 : c + 1)), []);

  useEffect(() => {
    if (lightboxOpen) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, lightboxOpen]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
      else if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, lightboxPrev, lightboxNext]);

  return (
    <>
      <section
        id="sobre"
        ref={sectionRef}
        className="py-20 md:py-32 relative overflow-hidden bg-[#0a0f0a]"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container px-4 relative z-10">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              UMA CASA QUE{" "}
              <span className="text-gold-gradient">CONTA HISTÓRIAS.</span>
            </h2>

            <p className="font-serif text-xl md:text-2xl italic text-white/60 mb-8 leading-relaxed">
              Existem imóveis que oferecem espaço.
              E existem residências que oferecem uma experiência de vida.
            </p>

            <p className="text-base sm:text-lg text-white/70 mb-4 leading-relaxed">
              Com <strong className="text-white">372m² de área construída</strong> sobre um terreno de 400m², esta casa combina 
              sofisticação, conforto e tecnologia no coração do <strong className="text-white">Condomínio Horizon Clube Residencial</strong>, 
              em Estância Velha.
            </p>

            <p className="text-base sm:text-lg text-white/70 mb-6 leading-relaxed">
              São <strong className="text-white">3 suítes amplas</strong>, lavabo, sala de estar com lareira e ambientes de 
              cozinha e jantar integrados. A área externa é um convite ao lazer: varanda gourmet com churrasqueira, piscina e uma 
              <strong className="text-white"> vista deslumbrante para o pôr do sol</strong>, com frente para área verde.
            </p>

            <div className="w-16 h-px bg-primary/50 mx-auto my-8" />

            <p className="font-serif text-xl md:text-2xl font-semibold text-white">
              Automação completa, energia solar fotovoltaica
            </p>
            <p className="font-serif text-xl md:text-2xl font-semibold text-primary">
              e um cenário inesquecível todos os dias.
            </p>

            {/* Gallery */}
            <div className="mt-12 relative group">
              <div
                className="rounded-lg overflow-hidden shadow-2xl aspect-video relative cursor-pointer"
                onClick={() => openLightbox(current)}
              >
                {GALLERY_IMAGES.map((img, i) => (
                  <img
                    key={i}
                    src={img.src}
                    alt={img.alt}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ))}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white/0 hover:text-white/80 text-sm font-medium transition-colors">
                    Clique para ampliar
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {GALLERY_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-primary w-6" : "bg-white/30 hover:bg-white/50"}`}
                    aria-label={`Foto ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none overflow-hidden [&>button]:hidden">
          <div className="relative flex items-center justify-center w-full h-[90vh]">
            <img
              src={GALLERY_IMAGES[lightboxIndex].src}
              alt={GALLERY_IMAGES[lightboxIndex].alt}
              className="max-w-full max-h-full object-contain"
            />

            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            <button
              onClick={lightboxPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next */}
            <button
              onClick={lightboxNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {GALLERY_IMAGES.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CA2727AboutSection;
