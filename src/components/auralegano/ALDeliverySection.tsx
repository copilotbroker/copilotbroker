import { useEffect, useRef, useState } from "react";
import { Calendar, Hammer, Users, ListChecks } from "lucide-react";

const items = [
  { icon: Hammer, text: "O projeto já está em andamento" },
  { icon: Users, text: "O interesse já está consolidado" },
  { icon: ListChecks, text: "As unidades estão sendo definidas" },
];

const ALDeliverySection = () => {
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-4">Entrega próxima</p>

          <div className="inline-flex items-center gap-3 px-6 py-4 mb-8 rounded-2xl bg-primary/10 border border-primary/30">
            <Calendar className="w-7 h-7 text-primary" />
            <span className="font-serif text-2xl md:text-3xl font-bold text-foreground">Julho de 2026</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {items.map((item, index) => (
              <div
                key={item.text}
                className={`flex flex-col items-center gap-3 p-5 bg-card rounded-lg border border-border/50 transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
                style={{ transitionDelay: `${200 + index * 120}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-foreground text-center">
                  <span className="text-primary mr-1">👉</span>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ALDeliverySection;
