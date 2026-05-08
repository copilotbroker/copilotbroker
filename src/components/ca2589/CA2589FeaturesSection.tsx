import { useEffect, useRef, useState } from "react";
import { Bed, Bath, Car, Maximize, Sun, Flame, Waves, Wifi, Trees, Utensils } from "lucide-react";

const features = [
  { icon: Bed, label: "3 Suítes", detail: "Amplas e confortáveis" },
  { icon: Bath, label: "5 Banheiros", detail: "Acabamento premium" },
  { icon: Car, label: "4 Vagas", detail: "2 cobertas + 2 descobertas" },
  { icon: Maximize, label: "372m²", detail: "Área construída" },
  { icon: Sun, label: "Energia Solar", detail: "Sistema fotovoltaico" },
  { icon: Flame, label: "Lareira", detail: "Sala de estar" },
  { icon: Waves, label: "Piscina", detail: "Área externa" },
  { icon: Wifi, label: "Automação", detail: "Casa inteligente" },
  { icon: Trees, label: "Vista Verde", detail: "Frente para natureza" },
  { icon: Utensils, label: "Varanda Gourmet", detail: "Com churrasqueira" },
];

const CA2589FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-card relative overflow-hidden"
    >
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            O QUE ESSA CASA{" "}
            <span className="text-gold-gradient">OFERECE.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada detalhe foi pensado para proporcionar conforto, tecnologia e uma vida com qualidade.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.label}
              className={`card-luxury flex flex-col items-center text-center p-5 sm:p-6 group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-base font-semibold text-foreground mb-1">
                {feature.label}
              </h3>
              <p className="text-xs text-muted-foreground">{feature.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CA2589FeaturesSection;
