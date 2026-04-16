import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";

const ALLotSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="terreno" ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-3">Mapa interativo</p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            TERRENOS{" "}
            <span className="text-gold-gradient">DISPONÍVEIS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Explore o mapa interativo e veja em tempo real os lotes disponíveis no Aura Legano.
          </p>
        </div>

        <div className={`max-w-6xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl bg-card">
            <div className="h-[80vh] min-h-[600px] sm:h-auto sm:min-h-0 sm:aspect-[16/10] md:aspect-[16/9] w-full">
              <iframe
                src="https://avivaurbanismo.com.br/mapa-aura-legano/"
                title="Mapa Interativo Aura Legano - Terrenos Disponíveis"
                className="w-full h-full border-0"
                loading="lazy"
                allow="fullscreen"
              />
            </div>

            <a
              href="https://avivaurbanismo.com.br/mapa-aura-legano/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 inline-flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm hover:bg-background border border-border rounded-lg text-xs font-medium text-foreground transition-all shadow-lg"
              aria-label="Abrir mapa em tela cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abrir em tela cheia</span>
              <span className="sm:hidden">Ampliar</span>
            </a>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            👉 Clique nos lotes do mapa para conferir disponibilidade e detalhes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ALLotSection;
