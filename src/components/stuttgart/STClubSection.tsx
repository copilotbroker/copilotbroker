import { useEffect, useRef, useState } from "react";
import lazerImage from "@/assets/stuttgart/lazer.jpg";

const amenities = [
  "Piscina",
  "Fitness completo",
  "Salão de festas",
  "Coworking",
  "Espaço zen",
  "Espaço kids",
  "Espaço pet",
  "Área social com jacuzzi e fireplace",
];

const STClubSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = lazerImage;
  }, []);

  return (
    <section id="clube" ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            UM CONDOMÍNIO CLUBE{" "}
            <span className="text-gold-gradient">DE VERDADE</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O Jardins de Stuttgart foi pensado para substituir deslocamentos por experiências.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`grid grid-cols-2 gap-3 sm:gap-4 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            {amenities.map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-300"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="text-primary text-lg shrink-0">✔</span>
                <span className="text-sm sm:text-base text-foreground">{item}</span>
              </div>
            ))}
          </div>

          <div className={`relative transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}>
            <div className="relative rounded-lg overflow-hidden shadow-elegant">
              <div className={`aspect-[4/3] bg-muted transition-opacity duration-500 ${imageLoaded ? "opacity-0" : "opacity-100"}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              {imageLoaded && (
                <img
                  src={lazerImage}
                  alt="Área de lazer e wellness do Stuttgart"
                  className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="absolute -inset-2 border border-primary/20 rounded-lg -z-10" />
          </div>
        </div>

        <div className={`mt-12 max-w-3xl mx-auto text-center space-y-3 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-muted-foreground"><span className="text-primary">👉</span> Um ambiente que atende todas as idades</p>
          <p className="text-muted-foreground"><span className="text-primary">👉</span> Um espaço que conecta famílias</p>
          <p className="text-muted-foreground"><span className="text-primary">👉</span> Um lugar onde cada detalhe foi pensado para o dia a dia</p>
        </div>
      </div>
    </section>
  );
};

export default STClubSection;
