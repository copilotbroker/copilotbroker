import { useEffect, useRef, useState } from "react";
import { Compass, Move3d } from "lucide-react";

const ALTour360Section = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [loadIframe, setLoadIframe] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setLoadIframe(true);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="tour360"
      ref={sectionRef}
      className="py-20 md:py-32 bg-gradient-to-b from-background via-card/30 to-background relative overflow-hidden"
    >
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Compass className="w-3.5 h-3.5 text-primary" />
            <p className="text-primary text-xs font-semibold uppercase tracking-wider">
              Experiência imersiva
            </p>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            TOUR <span className="text-gold-gradient">360°</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Explore o Aura Legano em todos os ângulos. Navegue pelos espaços e descubra cada detalhe do empreendimento.
          </p>
        </div>

        <div
          className={`max-w-6xl mx-auto transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/10 bg-card group">
            <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 pointer-events-none">
              <Move3d className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Arraste para explorar</span>
            </div>

            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              {loadIframe ? (
                <iframe
                  src="https://tour360.meupasseiovirtual.com/0102/243439/tourvirtual/"
                  title="Tour Virtual 360° - Aura Legano"
                  className="absolute inset-0 w-full h-full"
                  frameBorder={0}
                  allow="accelerometer; gyroscope; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 italic">
            <span className="text-primary">👉</span> Uma visita virtual completa, sem sair de casa.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ALTour360Section;
