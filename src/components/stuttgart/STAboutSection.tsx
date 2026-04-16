import { useEffect, useRef, useState } from "react";
import { Waves, Users, Briefcase, Dumbbell, Sofa } from "lucide-react";
import insercaoImg from "@/assets/stuttgart/insercao.webp";
import fachadaNoturnaImg from "@/assets/stuttgart/fachada-noturna.webp";
import ramblaImg from "@/assets/stuttgart/rambla.webp";
import STImageLightbox, { LightboxImage } from "./STImageLightbox";

const contextImages: LightboxImage[] = [
  { src: insercaoImg, alt: "Vista aérea de Ivoti com o Jardins de Stuttgart inserido na paisagem", caption: "Localização privilegiada em Ivoti" },
  { src: fachadaNoturnaImg, alt: "Fachada noturna iluminada do Jardins de Stuttgart", caption: "Fachada noturna" },
  { src: ramblaImg, alt: "Rambla externa com bancos e jardim vertical", caption: "Rambla de convivência" },
];

const items = [
  { icon: Waves, text: "Piscina" },
  { icon: Users, text: "Espaços de convivência" },
  { icon: Briefcase, text: "Coworking" },
  { icon: Dumbbell, text: "Academia" },
  { icon: Sofa, text: "Ambientes para relaxar, trabalhar e viver" },
];

const STAboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="novo-jeito" ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            UM NOVO JEITO DE{" "}
            <span className="text-gold-gradient">MORAR EM IVOTI</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">
            Não é só sobre um apartamento.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground mb-12 leading-relaxed">
            É sobre ter tudo o que você precisa… <strong className="text-foreground">todos os dias… a poucos passos.</strong>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-12">
            {items.map((item, index) => (
              <div
                key={item.text}
                className={`card-luxury p-5 text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs sm:text-sm text-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <div className={`space-y-4 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <span className="text-primary">👉</span>
              Aqui, sair de casa deixa de ser uma necessidade.
            </p>
            <div className="divider-gold mx-auto my-8" />
            <p className="font-serif text-xl md:text-2xl italic text-foreground">
              E viver bem
            </p>
            <p className="font-serif text-xl md:text-2xl font-semibold text-primary">
              se torna rotina.
            </p>
          </div>
        </div>

        {/* Faixa visual de contexto */}
        <div className={`mt-20 max-w-6xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {contextImages.map((img, i) => (
              <button
                type="button"
                key={img.src}
                onClick={() => setLightboxIndex(i)}
                className="group relative rounded-lg overflow-hidden shadow-elegant aspect-[4/3] cursor-zoom-in"
                aria-label={`Ampliar ${img.caption}`}
              >
                <img src={img.src} alt={img.alt} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white text-xs md:text-sm font-medium text-left">
                  {img.caption}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <STImageLightbox
        images={contextImages}
        startIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </section>
  );
};

export default STAboutSection;
