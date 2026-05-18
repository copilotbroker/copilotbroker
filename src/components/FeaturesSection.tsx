import { useEffect, useRef, useState } from "react";
import { Gem, MapPin, Ruler, ShieldCheck, TrendingUp, Eye } from "lucide-react";

const features = [
  { icon: Gem, title: "Empreendimentos de alto padrão" },
  { icon: MapPin, title: "Localizações estratégicas e privilegiadas" },
  { icon: Ruler, title: "Unidades com metragens diferenciadas" },
  { icon: ShieldCheck, title: "Condições exclusivas de pré-lançamento" },
  { icon: TrendingUp, title: "Alto potencial de valorização" },
  { icon: Eye, title: "Acesso antes da divulgação oficial" },
];

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="py-16 sm:py-20 md:py-32 bg-secondary/30 relative overflow-hidden"
      aria-labelledby="features-title"
    >
      {/* Decorative Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
      
      <div className="container relative z-10 px-4">
        <header className={`text-center mb-12 sm:mb-16 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
          <h2 id="features-title" className="section-title mb-4 text-2xl sm:text-3xl md:text-4xl">
            O Que Você Recebe ao{