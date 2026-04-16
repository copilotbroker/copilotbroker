import { useEffect, useRef, useState } from "react";
import { Maximize, Trees, Building2 } from "lucide-react";

const stats = [
  { icon: Maximize, value: "+200.000", unit: "m²", label: "de área total" },
  { icon: Trees, value: "+30.000", unit: "m²", label: "de área verde integrada" },
  { icon: Building2, value: "+4.000", unit: "m²", label: "de estrutura social construída" },
];

const ALProjectSection = () => {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            UM PROJETO QUE{" "}
            <span className="text-gold-gradient">JÁ NASCEU GRANDE</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`card-luxury h-full flex flex-col items-center text-center p-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <stat.icon className="w-8 h-8 text-primary" />
              </div>
              <p className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                {stat.value}
                <span className="text-primary ml-1">{stat.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-serif text-lg md:text-xl text-muted-foreground italic">
            <span className="text-primary">👉</span> Um condomínio planejado para entregar estrutura, conforto e valorização desde o início.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ALProjectSection;
