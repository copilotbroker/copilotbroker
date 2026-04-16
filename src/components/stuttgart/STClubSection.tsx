import { useEffect, useRef, useState } from "react";
import { Heart, Users, Sparkles } from "lucide-react";
import academiaImg from "@/assets/stuttgart/academia.webp";
import porticoImg from "@/assets/stuttgart/portico.webp";

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

const lifestyle = [
  { icon: Users, title: "Para todas as idades", desc: "Ambientes que acolhem crianças, jovens, adultos e a melhor idade." },
  { icon: Heart, title: "Que conecta famílias", desc: "Espaços de convivência que aproximam quem você ama." },
  { icon: Sparkles, title: "Pensado nos detalhes", desc: "Cada metro foi projetado para o seu dia a dia, não para fotos." },
];

const STClubSection = () => {
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

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-lg overflow-hidden shadow-elegant aspect-[3/4] col-span-1 row-span-2">
                <img src={porticoImg} alt="Acesso e pórtico do Jardins de Stuttgart" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white/95 text-xs font-medium">Pórtico exclusivo</div>
              </div>
              <div className="relative rounded-lg overflow-hidden shadow-elegant aspect-[4/3]">
                <img src={academiaImg} alt="Academia equipada do condomínio" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white/95 text-[11px] font-medium">Academia completa</div>
              </div>
              <div className="relative rounded-lg overflow-hidden shadow-elegant aspect-[4/3] bg-primary/10 flex items-center justify-center text-center p-4 border border-primary/20">
                <p className="font-serif text-primary text-sm md:text-base">+ piscina,<br/>coworking,<br/>espaço kids…</p>
              </div>
            </div>
            <div className="absolute -inset-2 border border-primary/20 rounded-lg -z-10" />
          </div>
        </div>

        <div className={`max-w-5xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="text-center mb-10">
            <p className="font-serif text-xl md:text-2xl text-foreground">
              Mais que estrutura. <span className="text-gold-gradient italic">É um jeito de viver.</span>
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {lifestyle.map((item, i) => (
              <div
                key={item.title}
                className="card-luxury p-6 text-center"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default STClubSection;
