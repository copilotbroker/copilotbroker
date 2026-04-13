import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const GALLERY_IMAGES = [
  { src: "https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg", alt: "Vista frontal da casa" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f59bfe48-ffc9-4cbb-add5-d4be0e0e8da1.jpeg", alt: "Fachada principal" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/fe78429d-b427-4639-86f5-5cb572c06394.jpeg", alt: "Detalhe da fachada" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/cb25fb26-3d1f-4082-832d-94cc17844129.jpeg", alt: "Vista lateral" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/77893339-d418-4be9-a55c-65d78683309c.jpeg", alt: "Área externa" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/5116a3db-edc8-429a-9767-3d918a817b76.jpeg", alt: "Jardim" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/3648cd93-b238-4dbb-9b1c-4fa94084cd93.jpeg", alt: "Entrada" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/aa886770-97c1-4e8c-8327-09b7c0dd7ea1.jpeg", alt: "Hall de entrada" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/519eae83-0521-4892-8f0b-0c51e3840ebd.jpeg", alt: "Sala de estar" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/8f8b3bed-58e6-4c5b-bc64-47a97397463d.jpeg", alt: "Sala com lareira" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/ca857da2-45e5-4f51-bdd3-1b46a4d27f9b.jpeg", alt: "Ambiente integrado" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/91054501-6589-413b-b9ec-ed2f8bd78dd7.jpeg", alt: "Cozinha" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/1437e3ce-4ba6-4ffc-9ded-dd99c3197152.jpeg", alt: "Cozinha detalhe" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/0007d89b-5583-4c8c-a1cd-7510e4de7445.jpeg", alt: "Área gourmet" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/969890a3-28b7-404e-b671-3fee6c95ec4f.jpeg", alt: "Churrasqueira" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/db0d6ab6-b55f-4610-b397-2c17ff0878bd.jpeg", alt: "Varanda gourmet" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/bb5b44d2-0342-409f-80e8-60f2c5d1e4d3.jpeg", alt: "Espaço externo" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/8a6ad9e7-9267-4738-bbc6-c0aba93a542e.jpeg", alt: "Piscina" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/8d53ba46-12d4-4621-ab4b-07bc801c70f2.jpeg", alt: "Área de lazer" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/27cf016d-5786-460a-96a8-d975f6c0da57.jpeg", alt: "Vista da piscina" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/665021e9-a92c-49df-8ca6-cf22ad0a8a1c.jpeg", alt: "Deck" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/fcc76b71-0575-4dba-ae18-caa917f83ee9.jpeg", alt: "Vista panorâmica" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/9396689a-f01f-4b6f-94fd-055cdcf8740d.jpeg", alt: "Pôr do sol" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/781beed7-ea39-4ced-8d84-d9a827021225.jpeg", alt: "Suíte master" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/02c1b583-d919-42aa-a07f-aabe6aab77d4.jpeg", alt: "Quarto" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/16391613-b288-4ad4-9c0f-a3b7f8b40e8d.jpeg", alt: "Suíte" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/e5740e58-0623-4e89-bc44-738f5bae2002.jpeg", alt: "Banheiro suíte" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/320cac40-d74d-4dac-b7b6-957a03ce5493.jpeg", alt: "Banheiro" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/feedb68d-a3de-4bb9-ad7a-51358439ccf3.jpeg", alt: "Lavabo" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/52a7dea0-026e-48e6-9179-2db8c870767d.jpeg", alt: "Corredor" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/d84bd10f-b9e0-4eaa-a62e-b9627ff01ade.jpeg", alt: "Escada" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/2d61529c-e0e3-45d2-9504-0c679a9d8018.jpeg", alt: "Segundo pavimento" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/384e0e4e-518c-4ade-9794-e9026118db00.jpeg", alt: "Escritório" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/0d2f54d1-e09f-4546-9392-861596aff612.jpeg", alt: "Closet" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/1d19c9db-a700-4e3f-9eef-f7e70ef4e605.jpeg", alt: "Detalhe interno" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/405e6cd0-fab8-42ee-ae7a-6f2fc5a4ab3b.jpeg", alt: "Iluminação" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/b18b033a-dd7a-4f5f-8198-ae635b2cca86.jpeg", alt: "Automação" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/374ad65d-5e20-4db8-ac98-7e341679ca2d.jpeg", alt: "Garagem" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/564ea095-31bf-4240-8435-0856da2b9d61.jpeg", alt: "Lavanderia" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/e3790f08-2557-48a8-ba41-3aa594f119b7.jpeg", alt: "Infraestrutura" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/a4208dd1-ce40-42f5-9032-71b0be7fe690.jpeg", alt: "Energia solar" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/4ffea792-ac9d-4593-b871-1ced9932eee9.jpeg", alt: "Painel fotovoltaico" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/3befc581-52d7-4008-8ecf-1e62f615aebe.jpeg", alt: "Detalhe externo" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/a938046d-b231-45f1-9835-1486c008eee3.jpeg", alt: "Paisagismo" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/bb22da0e-f4d3-43a8-b81b-29ed21ecd8ab.jpeg", alt: "Jardim lateral" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/c840d183-953d-4cbb-bebb-581a8bcb02b1.jpeg", alt: "Muro verde" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f08fff64-1465-415a-aea6-91076aa0fb7a.jpeg", alt: "Vista aérea" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/91eeffb9-a0ab-4aa8-b7fa-000fc1e43369.jpeg", alt: "Condomínio" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/692a7caf-573c-42a7-aeeb-f9c53e2f8bb7.jpeg", alt: "Portaria" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/df6e2e79-5201-4123-95da-19731c0b9579.jpeg", alt: "Área comum" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/b79b37ed-dd04-4788-834c-c837b0a36303.jpeg", alt: "Salão de festas" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/285761dd-1956-43b5-bb6b-49a5c8bcfab6.jpeg", alt: "Playground" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/6acb8721-36d2-4fbb-b17a-3351fce6073c.jpeg", alt: "Quadra" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/222d6ed7-8428-4273-94f3-c752b12b6a26.jpeg", alt: "Espaço fitness" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f2e53e21-87d5-445f-9e2e-8ef9706e210c.jpeg", alt: "Lago" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/e5768257-78c7-47e9-9c7b-9e818b92cd7f.jpeg", alt: "Trilha" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/f01f0ff0-659e-43d3-a19b-4498053f8db2.jpeg", alt: "Natureza" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/ee27bfeb-0360-4ba3-8a2f-4227b6802211.jpeg", alt: "Vista verde" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/3d62b721-118c-4334-bd26-7bf4a9363fbb.jpeg", alt: "Entorno" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/0cd1fa4a-e420-41d0-bc1a-a96625c1a54d.jpeg", alt: "Rua do condomínio" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/bda5e16e-0c3f-427d-a063-db9f0fad1092.jpeg", alt: "Acesso" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/4af0d267-a9d9-4d54-bc2a-37b326aada18.jpeg", alt: "Vizinhança" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/7e097a84-12c0-4b05-9071-f5ee9f528445.jpeg", alt: "Localização" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/45655420-973c-4eee-bd03-edb806cd302c.jpeg", alt: "Vista do bairro" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/638d8725-3908-47e1-876f-b409b11ba847.jpeg", alt: "Região" },
  { src: "https://flip-prod-fotos.s3.amazonaws.com/888ca174-9659-4779-ad7d-de0ad4c6c984.jpeg", alt: "Vista geral" },
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none overflow-hidden [&>button]:hidden">
          <div className="relative flex items-center justify-center w-full h-[90vh]">
            <img
              src={GALLERY_IMAGES[lightboxIndex].src}
              alt={GALLERY_IMAGES[lightboxIndex].alt}
              className="max-w-full max-h-full object-contain"
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

export default CA2727AboutSection;
