import { useEffect, useRef, useState } from "react";
import { Trophy, MapPin, TrendingUp, Heart } from "lucide-react";

const stats = [
  { value: "1º", label: "do Vale do Sinos", icon: Trophy },
  { value: "8º", label: "do Rio Grande do Sul", icon: MapPin },
  { value: "Top", label: "qualidade de vida no Brasil", icon: Heart },
];

const highlights = [
  { icon: Heart, title: "Bem-estar", desc: "Cidade tranquila, segura e com forte senso de comunidade." },
  { icon: TrendingUp, title: "Valorização", desc: "Município em crescimento contínuo e desenvolvimento urbano planejado." },
  { icon: MapPin, title: "Localização estratégica", desc: "A poucos minutos de Novo Hamburgo, São Leopoldo e da Serra Gaúcha." },
];

const STQualityOfLifeSection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-4">Reconhecimento nacional</p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            IVOTI ESTÁ ENTRE AS CIDADES COM{" "}
            <span className="text-gold-gradient">MELHOR QUALIDADE DE VIDA DO RIO GRANDE DO SUL</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Ivoti é o <strong className="text-foreground">1º município do Vale do Sinos</strong> e o{" "}
            <strong className="text-foreground">8º do Rio Grande do Sul</strong>.
          </p>
        </div>

        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 delay-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="divider-gold mx-auto my-8" />
          <p className="font-serif text-xl md:text-2xl italic text-foreground">
            Morar em Ivoti é viver onde o Brasil vive melhor.
          </p>
        </div>
      </div>
    </section>
  );
};

export default STQualityOfLifeSection;
