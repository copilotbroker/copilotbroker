import { useEffect, useRef, useState } from "react";
import { Ship, ShieldCheck, Sailboat, Fish, MapPin } from "lucide-react";
import marinaRender from "@/assets/nau/marina-render.jpg";

const features = [
  { icon: Ship, text: "Marina privativa com atracadouro" },
  { icon: Sailboat, text: "Lotes navegáveis com saída direta à lagoa" },
  { icon: Fish, text: "Pesca, esportes náuticos e lazer aquático" },
  { icon: ShieldCheck, text: "Condomínio fechado com segurança 24h" },
  { icon: MapPin, text: "Osório — a 1h de Porto Alegre e da Serra" },
];

const NAUFeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const imageObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => setImageLoaded(true);
          img.src = marinaRender;
          imageObserver.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    if (imageRef.current) imageObserver.observe(imageRef.current);
    return () => imageObserver.disconnect();
  }, []);

  return (
    <section
      id="diferenciais"
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[hsl(200,60%,40%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            UM CONDOMÍNIO FEITO PARA{" "}
            <span className="text-[hsl(200,60%,55%)]">QUEM VIVE A ÁGUA</span>
          </h2>
          <p className="text-lg text-white/60">
            Cada detalhe do NAU foi pensado para integrar sua vida à lagoa.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-[hsl(210,35%,10%)]/50 border border-[hsl(200,60%,40%)]/10 hover:border-[hsl(200,60%,40%)]/30 transition-all duration-300"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[hsl(200,60%,40%)]/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[hsl(200,60%,55%)]" />
                </div>
                <div className="flex items-center pt-3">
                  <p className="text-base sm:text-lg text-white/90">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            ref={imageRef}
            className={`relative transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <div className={`aspect-[4/3] bg-[hsl(210,35%,12%)] transition-opacity duration-500 ${imageLoaded ? "opacity-0" : "opacity-100"}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-[hsl(200,60%,40%)] border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              {imageLoaded && (
                <img
                  src={marinaRender}
                  alt="Marina do NAU Condomínio Náutico"
                  className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,35%,8%)]/40 to-transparent" />
            </div>
            <div className="absolute -inset-2 border border-[hsl(200,60%,40%)]/20 rounded-lg -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default NAUFeaturesSection;
