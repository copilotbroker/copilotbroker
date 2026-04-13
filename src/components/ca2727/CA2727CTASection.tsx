import { useEffect, useRef, useState } from "react";
import { Home, MapPin, Maximize } from "lucide-react";

const CTA_IMG = "https://flip-prod-fotos.s3.amazonaws.com/cb25fb26-3d1f-4082-832d-94cc17844129.jpeg";

const features = [
  { icon: Home, text: "Horizon Clube Residencial" },
  { icon: Maximize, text: "372m² construídos" },
  { icon: MapPin, text: "Estância Velha, RS" },
];

const CA2727CTASection = () => {
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

  const scrollToForm = () => {
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <img src={CTA_IMG} alt="" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-background/65" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              VOCÊ MERECE{" "}
              <span className="text-gold-gradient">VIVER ASSIM.</span>
            </h2>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={feature.text}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-card/90 backdrop-blur-sm rounded-full border border-primary/40 transition-all duration-500 ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">{feature.text}</span>
                </div>
              ))}
            </div>

            <p className="text-xl sm:text-2xl font-serif font-bold text-white drop-shadow-lg mb-4">
              R$ 3.900.000
            </p>

            <p className="text-white/70 drop-shadow-md">
              <span className="text-primary">👉</span>{" "}
              Oportunidade única. Agende sua visita exclusiva.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <button
              onClick={scrollToForm}
              className="btn-primary text-base px-10 py-5 animate-pulse-slow"
            >
              Quero Agendar uma Visita
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CA2727CTASection;
