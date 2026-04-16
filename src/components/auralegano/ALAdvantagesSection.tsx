import { useEffect, useRef, useState } from "react";
import { Scale, ShieldCheck, GraduationCap } from "lucide-react";

const advantages = [
  {
    icon: Scale,
    title: "Equilíbrio perfeito",
    description:
      "O perfeito equilíbrio entre trabalho, moradia, lazer e fácil deslocamento — tudo o que você precisa, ao seu alcance.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança 24h",
    description:
      "Segurança garantida para você e sua família, com monitoramento 24 horas por dia, todos os dias do ano.",
  },
  {
    icon: GraduationCap,
    title: "Educação La Salle",
    description:
      "A Rede de escolas La Salle está presente no bairro, oferecendo a melhor educação para os seus filhos.",
  },
];

const ALAdvantagesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="vantagens"
      ref={sectionRef}
      className="py-20 md:py-32 bg-gradient-to-b from-background via-card/30 to-background relative overflow-hidden"
    >
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div
          className={`text-center mb-14 max-w-3xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            Bairro Cidade Legano
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            CONHEÇA AS <span className="text-gold-gradient">VANTAGENS</span> DE MORAR NO LEGANO
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            O Aura Legano está dentro do bairro cidade Legano — um ecossistema planejado para entregar qualidade de vida em cada detalhe.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {advantages.map((adv, index) => (
            <div
              key={adv.title}
              className={`group relative p-8 bg-card rounded-2xl border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="w-14 h-14 mb-6 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <adv.icon className="w-7 h-7 text-primary" />
              </div>

              <h3 className="font-serif text-xl md:text-2xl font-bold mb-3 text-foreground">
                {adv.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                {adv.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className={`text-center mt-12 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-serif text-lg md:text-xl italic text-muted-foreground max-w-2xl mx-auto">
            <span className="text-primary">👉</span> Mais que um endereço — um bairro pensado para viver bem todos os dias.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ALAdvantagesSection;
