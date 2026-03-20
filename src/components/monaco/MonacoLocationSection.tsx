import { useEffect, useRef, useState } from "react";
import { MapPin, TrendingUp, Shield, Award } from "lucide-react";

const credentials = [
  { icon: MapPin, title: "Localização", description: "Lagoa dos Quadros, Xangri-lá" },
  { icon: Award, title: "Exclusividade", description: "Ativo escasso e desejado" },
  { icon: TrendingUp, title: "Valorização", description: "Forte tendência de crescimento" },
  { icon: Shield, title: "Segurança", description: "Patrimônio natural preservado" },
];

const MonacoLocationSection = () => {
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
      id="localizacao"
      ref={sectionRef}
      className="py-20 md:py-32 bg-background relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            LOCALIZAÇÃO ESTRATÉGICA,{" "}
            <span className="text-gold-gradient">POTENCIAL RARO</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">
            A <strong className="text-foreground">Lagoa dos Quadros</strong> é um dos ativos imobiliários mais seguros do litoral.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground mb-12 leading-relaxed">
            Impulsionado pela escassez de áreas preservadas e pela alta demanda por qualidade de vida com facilidade logística.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {credentials.map((item, index) => (
              <div
                key={item.title}
                className={`card-luxury p-6 text-center transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className={`space-y-4 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <span className="text-primary">👉</span>
              Ao lado do aeródromo privado D1 Fly
            </p>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <span className="text-primary">👉</span>
              A apenas 5 minutos da Estrada do Mar e do Centro de Atlântida
            </p>

            <div className="divider-gold mx-auto my-8" />

            <p className="font-serif text-xl md:text-2xl italic text-foreground">
              O tipo de projeto que conversa com quem não procura apenas um lote.
            </p>
            <p className="font-serif text-xl md:text-2xl font-semibold text-primary">
              Está procurando um ativo escasso, desejado e com apelo de lifestyle real.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MonacoLocationSection;
