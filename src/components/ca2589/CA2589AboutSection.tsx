import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const GALLERY_IMAGES = [
  { src: "https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg", alt: "Vista frontal da casa" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/d5992b90-42a4-4296-a3cd-3c4f122cedd7.jpeg", alt: "Fachada principal" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/3b55f6eb-ef76-4dce-b5c8-7b6ae54f780b.jpeg", alt: "Piscina e deck" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/ba923b02-3108-4ac3-9e3a-9d8c79f84aed.jpeg", alt: "Vista lateral" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/5fc78be3-11d1-496d-87a7-474566668f39.jpeg", alt: "Área externa" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/2fdd21a1-1df9-4caa-9284-877e883a65bc.jpeg", alt: "Fachada noturna" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/446281c6-8ef0-47cb-8799-89c8e6134a99.jpeg", alt: "Entrada" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/aff72a02-9b2f-4d0f-8583-49398e581be6.jpeg", alt: "Hall" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/67883f56-23fc-43d1-931d-fa341fee1e94.jpeg", alt: "Living integrado" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/59e9a710-4371-494f-8b5f-ce2450f165d2.jpeg", alt: "Sala de estar" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/361d57f6-400e-4f08-9928-4f16fecb8961.jpeg", alt: "Sala de jantar" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/1eeb6ed0-c936-420d-9293-898b8e2c40ac.jpeg", alt: "Lareira" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/feebefb4-6b8d-4ae9-9cc4-50da71cf5d5a.jpeg", alt: "Pé-direito em madeira" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/933a6b0d-81de-42a5-a53b-4a3878fac4cb.jpeg", alt: "Cozinha" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/91e0881d-eea8-497d-b7e5-91d7ed131a32.jpeg", alt: "Cozinha integrada" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/61ecfcad-c2f6-4212-ba97-078790a6e388.jpeg", alt: "Espaço gourmet" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/45de81c4-0b4e-4980-9309-a5cc818fae94.jpeg", alt: "Churrasqueira" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/287ec374-abd0-4ed6-880f-c06c157d6416.jpeg", alt: "Área gourmet com vista" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/e3a7b225-a7ec-4034-853e-0b08a994167f.jpeg", alt: "Varanda" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/e5630e45-81c6-49bd-9c3b-0574d291a772.jpeg", alt: "Vista da varanda" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f1e36da5-f7da-484d-831f-b332689601ff.jpeg", alt: "Pôr do sol" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f80395ff-e8ee-463e-8fd5-d662a10469c8.jpeg", alt: "Vista do pôr do sol" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/0e6c9c7d-42a8-4c5c-8d5c-c1c2ff1d86a2.jpeg", alt: "Piscina aquecida" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/b1252495-03ba-4780-94db-1256fd7169d2.jpeg", alt: "Deck da piscina" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/da6e4d7c-96d8-4d73-9e76-79f3a40efcbd.jpeg", alt: "Área de lazer externa" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/752cb5a1-e573-4f81-8d15-04959eb7ba48.jpeg", alt: "Suíte master" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/963d505f-bda9-446c-8c2a-0e96fd22b262.jpeg", alt: "Suíte master com closet" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/88120e43-9b88-44d1-b23f-530f734da451.jpeg", alt: "Closet" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/903c4901-ec42-448e-9d15-cd3f31662d0f.jpeg", alt: "Banheiro suíte master" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f485d7a2-6752-4dcb-9c00-9f780163cb60.jpeg", alt: "Suíte 2" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/7db96353-06d2-4e7b-98d2-fa6dbe63f3b0.jpeg", alt: "Suíte 3" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/a87e782f-eb04-4626-8dac-b6bcd8e901e7.jpeg", alt: "Suíte 4" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/cb2d546a-67eb-4c9c-8c89-54397cc4b847.jpeg", alt: "Banheiro suíte" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/e77929cf-029b-42b8-beb9-9d8e01c65eb2.jpeg", alt: "Banheiro" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/ff631081-fb01-476e-8ca2-bb22c1cf2657.jpeg", alt: "Lavabo" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/5660451b-99fd-4198-844f-ec79a7ea17b9.jpeg", alt: "Home office" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/ceef1ff0-19cd-4987-ac85-5d3559c51112.jpeg", alt: "Lavanderia" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/3c614c36-94fc-4d52-9c2b-4599853f8e82.jpeg", alt: "Detalhe interno" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f2544ffc-1864-4ce2-b643-cccb87f8ea64.jpeg", alt: "Corredor" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/93565d3b-8523-4d9f-8a37-da906beabdc4.jpeg", alt: "Acabamentos" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/40266d6a-1611-4e89-b044-0de2632ac337.jpeg", alt: "Iluminação" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/18105933-8290-4ae0-9bd7-0d289ac77062.jpeg", alt: "Garagem coberta" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/5236a613-a68c-48aa-9917-7fd01232c899.jpeg", alt: "Placas solares" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/68850802-3690-4932-abd6-98cd75b14f82.jpeg", alt: "Energia solar" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/a778360c-1e19-4a98-a31a-7dbc0e8b47a4.jpeg", alt: "Vista aérea" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/91b2ab07-ff4d-4c67-b832-d2c4bf9169af.jpeg", alt: "Vista do condomínio" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/5de09020-a201-41b9-b886-21e7f8a03940.jpeg", alt: "Lago do condomínio" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/cebe3f14-3b8d-4524-ad0a-696837332ed0.jpeg", alt: "Área verde" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/dae1a987-c1ea-4d0a-acc4-0db5f0352cb8.jpeg", alt: "Paisagismo" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/8e144123-2fef-400c-9239-4709fa91327f.jpeg", alt: "Entorno" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/a27267bb-9c39-4072-b0ca-53c2bba9a420.jpeg", alt: "Vizinhança" },
];

const CA2589AboutSection = () => {
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
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ))}
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

              {/* Counter instead of dots (too many images for dots) */}
              <div className="flex justify-center gap-2 mt-4">
                <span className="text-white/50 text-sm">
                  {current + 1} / {GALLERY_IMAGES.length} fotos
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] p-0 bg-black/95 border-none overflow-auto [&>button]:hidden">
          <div className="relative min-h-full flex items-center justify-center p-2 sm:p-6">
            <img
              src={GALLERY_IMAGES[lightboxIndex].src}
              alt={GALLERY_IMAGES[lightboxIndex].alt}
              className="w-full sm:w-auto sm:max-w-none sm:max-h-none object-contain sm:object-none"
            />

            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={lightboxPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={lightboxNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {GALLERY_IMAGES.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CA2589AboutSection;
