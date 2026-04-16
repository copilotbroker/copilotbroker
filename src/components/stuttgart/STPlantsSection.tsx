import { useEffect, useRef, useState } from "react";
import { Home } from "lucide-react";
import living03 from "@/assets/stuttgart/living-03.webp";
import cozinha03 from "@/assets/stuttgart/cozinha-03.webp";
import suite03 from "@/assets/stuttgart/suite-03.webp";
import sacada03 from "@/assets/stuttgart/sacada-03.webp";
import living04 from "@/assets/stuttgart/living-04.webp";
import cozinha04 from "@/assets/stuttgart/cozinha-04.webp";
import dorm04 from "@/assets/stuttgart/dorm-04.webp";
import sacada04 from "@/assets/stuttgart/sacada-04.webp";
import duplexImg from "@/assets/stuttgart/duplex.webp";
import gardenImg from "@/assets/stuttgart/garden.webp";
import terracoImg from "@/assets/stuttgart/terraco.webp";
import garagemImg from "@/assets/stuttgart/garagem.webp";
import STImageLightbox, { LightboxImage } from "./STImageLightbox";

const plants = [
  "2 dormitórios com suíte",
  "2 dormitórios com suíte e garden",
  "3 dormitórios com suíte",
  "3 dormitórios com suíte e garden",
  "Coberturas duplex com 3 dormitórios",
];

const gallery: LightboxImage[] = [
  { src: living04, alt: "Living integrado com vista panorâmica", caption: "Living amplo e integrado" },
  { src: cozinha03, alt: "Cozinha moderna com bancada", caption: "Cozinha contemporânea" },
  { src: suite03, alt: "Suíte com vista para a serra", caption: "Suíte com vista" },
  { src: sacada04, alt: "Sacada com churrasqueira", caption: "Sacada gourmet" },
  { src: living03, alt: "Sala de estar acolhedora", caption: "Ambientes integrados" },
  { src: cozinha04, alt: "Cozinha com ilha e adega", caption: "Cozinha com ilha" },
  { src: dorm04, alt: "Dormitório infantil", caption: "Dormitórios planejados" },
  { src: sacada03, alt: "Sacada com churrasqueira", caption: "Espaço gourmet privativo" },
];

const tipologias: LightboxImage[] = [
  { src: gardenImg, alt: "Apartamento garden com terraço privativo e ofurô", caption: "Garden — Térreo com terraço privativo" },
  { src: duplexImg, alt: "Cobertura duplex com pé-direito alto e living amplo", caption: "Duplex — Coberturas em dois pavimentos" },
  { src: terracoImg, alt: "Terraço gourmet de cobertura visto de cima", caption: "Terraço — Espaço gourmet ao ar livre" },
];

const tipologiasMeta = [
  { tag: "Garden", title: "Térreo com terraço privativo", desc: "Spa, área externa e jardim só seu." },
  { tag: "Duplex", title: "Coberturas em dois pavimentos", desc: "Pé-direito generoso e vista panorâmica." },
  { tag: "Terraço", title: "Espaço gourmet ao ar livre", desc: "Spa, deck e gastronomia em casa." },
];

const STPlantsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="plantas" ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            PLANTAS PARA{" "}
            <span className="text-gold-gradient">DIFERENTES MOMENTOS DA VIDA</span>
          </h2>
          <p className="text-muted-foreground">Escolha o espaço que faz sentido para você:</p>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 mb-16">
          {plants.map((plant, index) => (
            <div
              key={plant}
              className={`flex items-center gap-4 p-5 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <span className="text-foreground">
                <span className="text-primary mr-2">✔</span>
                {plant}
              </span>
            </div>
          ))}
        </div>

        <div className={`max-w-6xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-8">
            <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground">
              Acabamento de quem entende de <span className="text-gold-gradient">viver bem</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-2">Toque para ampliar · Imagens ilustrativas dos apartamentos</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {gallery.map((img, i) => (
              <button
                type="button"
                key={img.src}
                onClick={() => setLightbox({ images: gallery, index: i })}
                className={`group relative rounded-lg overflow-hidden shadow-elegant aspect-[4/5] cursor-zoom-in transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
                aria-label={`Ampliar ${img.caption}`}
              >
                <img src={img.src} alt={img.alt} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] md:text-xs font-medium text-left">
                  {img.caption}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tipologias exclusivas */}
        <div className={`mt-20 max-w-6xl mx-auto transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-10">
            <h3 className="font-serif text-xl md:text-3xl font-semibold text-foreground">
              Tipologias <span className="text-gold-gradient">exclusivas</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-2">Para quem busca algo além do convencional</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {tipologias.map((img, i) => (
              <button
                type="button"
                key={img.src}
                onClick={() => setLightbox({ images: tipologias, index: i })}
                className="group relative rounded-lg overflow-hidden shadow-elegant aspect-[4/5] cursor-zoom-in"
                aria-label={`Ampliar ${tipologiasMeta[i].tag}`}
              >
                <img src={img.src} alt={img.alt} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                  <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-1">{tipologiasMeta[i].tag}</p>
                  <h4 className="font-serif text-white text-lg md:text-xl font-semibold">{tipologiasMeta[i].title}</h4>
                  <p className="text-white/80 text-sm mt-1">{tipologiasMeta[i].desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Garagem inteligente */}
        <div className={`mt-20 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <button
            type="button"
            onClick={() => setLightbox({ images: [{ src: garagemImg, alt: "Garagem com vagas e carregador para carros elétricos", caption: "Garagem com vaga e-car" }], index: 0 })}
            className="group relative rounded-lg overflow-hidden shadow-elegant aspect-[16/10] cursor-zoom-in"
            aria-label="Ampliar imagem da garagem"
          >
            <img src={garagemImg} alt="Garagem com vagas e carregador para carros elétricos" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </button>
          <div>
            <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Mobilidade</p>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
              Garagem com <span className="text-gold-gradient">vaga e-car</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Espaço amplo, iluminado e preparado para o futuro: vaga dedicada com carregador para carros elétricos, bicicletário e acesso direto aos elevadores.
            </p>
          </div>
        </div>

        <div className={`mt-12 text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-serif text-lg md:text-xl italic text-muted-foreground">
            <span className="text-primary">👉</span> Ambientes inteligentes, pensados para o seu dia a dia.
          </p>
        </div>
      </div>

      <STImageLightbox
        images={lightbox?.images ?? []}
        startIndex={lightbox?.index ?? 0}
        open={!!lightbox}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
};

export default STPlantsSection;
