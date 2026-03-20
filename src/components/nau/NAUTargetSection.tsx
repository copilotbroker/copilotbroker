import { useEffect, useRef, useState } from "react";
import { Users, TrendingUp, Heart } from "lucide-react";

const profiles = [
  {
    icon: Users,
    title: "Para famílias:",
    benefit: "Um lugar para criar seus filhos com liberdade, segurança e contato diário com a natureza e a água.",
  },
  {
    icon: TrendingUp,
    title: "Para investidores:",
    benefit: "Lotes navegáveis com acesso a lagoa são ativos escassos. A valorização é natural e acelerada.",
  },
  {
    icon: Heart,
    title: "Para quem quer viver diferente:",
    benefit: "Acordar com vista para a lagoa, sair de barco no fim de semana, pescar no seu quintal. Isso é o NAU.",
  },
];

const NAUTargetSection = () => {
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
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-[hsl(210,35%,8%)] relative overflow-hidden"
    >
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-[hsl(200,60%,40%)]/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            UM LOTE NAVEGÁVEL NÃO É APENAS UM TERRENO.{" "}
            <span className="text-[hsl(200,60%,55%)]">É UM ESTILO DE VIDA.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {profiles.map((profile, index) => (
            <div
              key={profile.title}
              className={`relative group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="h-full flex flex-col items-center text-center p-8 rounded-lg bg-[hsl(210,35%,10%)] border border-[hsl(200,60%,40%)]/10 hover:border-[hsl(200,60%,40%)]/30 transition-all duration-300">
                <div className="w-20 h-20 rounded-full bg-[hsl(200,60%,40%)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <profile.icon className="w-10 h-10 text-[hsl(200,60%,55%)]" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-4 text-white">{profile.title}</h3>
                <p className="text-white/60 leading-relaxed flex-1">{profile.benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NAUTargetSection;
