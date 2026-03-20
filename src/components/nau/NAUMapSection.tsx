import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

const NAUMapSection = () => {
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
      className="py-16 md:py-24 bg-[hsl(210,35%,6%)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(24,70%,42%)]/30 to-transparent" />

      <div className="container px-4">
        <div className={`text-center mb-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[hsl(24,70%,50%)]" />
            <span className="text-sm font-medium tracking-widest uppercase text-[hsl(24,70%,55%)]">Localização</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            Onde fica o <span className="text-[hsl(24,70%,50%)]">NAU</span>
          </h2>
          <p className="text-base sm:text-lg font-semibold tracking-wide uppercase text-[hsl(24,70%,55%)] mb-2">
            A apenas 1h de Porto Alegre, RS.
          </p>
          <p className="text-white/60 text-base sm:text-lg">
            Linha Peixoto, 1405 – Centro, Osório – RS
          </p>
        </div>

        <div className={`max-w-5xl mx-auto rounded-xl overflow-hidden border border-[hsl(24,70%,42%)]/20 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3472.0!2d-50.2586!3d-29.8875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zLTI5Ljg4NzUsLTUwLjI1ODY!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr&q=Linha+Peixoto,+1405+-+Centro,+Os%C3%B3rio+-+RS,+95520-000"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização do NAU Condomínio Náutico"
            className="w-full"
          />
        </div>

        <div className={`text-center mt-6 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <a
            href="https://www.google.com/maps/search/Linha+Peixoto,+1405+-+Centro,+Os%C3%B3rio+-+RS,+95520-000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[hsl(24,70%,50%)] border border-[hsl(24,70%,42%)]/30 rounded-lg hover:bg-[hsl(24,70%,42%)]/10 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Abrir no Google Maps
          </a>
        </div>
      </div>
    </section>
  );
};

export default NAUMapSection;
