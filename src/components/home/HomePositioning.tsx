import { useEffect, useRef, useState } from "react";
import { X, Clock, UserX, FileX, PhoneOff } from "lucide-react";

const pains = [
  { icon: Clock, text: "Lead chega às 22h e ninguém responde até o outro dia." },
  { icon: UserX, text: "Corretor sumiu? O lead vai junto. E nunca mais volta." },
  { icon: FileX, text: "Planilha do Excel, caderno, post-it... e o follow-up perdido." },
  { icon: PhoneOff, text: "Cliente já foi atendido? Outro corretor liga e queima a marca." },
];

const HomePositioning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="posicionamento"
      className="py-16 sm:py-20 px-4 bg-[#0f0f12]"
      aria-labelledby="positioning-heading"
    >
      <div
        className={`container max-w-4xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h2
          id="positioning-heading"
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-6 leading-tight"
        >
          Se você é dono de imobiliária, esse cenário é{" "}
          <span className="text-destructive">familiar</span>:
        </h2>

        <p className="text-center text-white/70 mb-12 text-base sm:text-lg max-w-2xl mx-auto">
          Toda imobiliária do RS sangra dinheiro nesses 4 buracos invisíveis. Veja se
          você se identifica:
        </p>

        <ul className="space-y-4 mb-10" role="list">
          {pains.map(({ icon: Icon, text }, i) => (
            <li
              key={text}
              className={`flex items-start gap-4 p-5 rounded-xl bg-[#111114] border border-destructive/20 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-destructive" aria-hidden="true" />
              </div>
              <div className="flex items-start gap-2 pt-1.5">
                <X className="w-4 h-4 text-destructive shrink-0 mt-1" aria-hidden="true" />
                <span className="text-white/90 text-base sm:text-lg">{text}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="text-center mt-12 p-6 rounded-xl bg-primary/5 border border-primary/30">
          <p className="text-lg sm:text-xl font-serif text-white italic">
            Cada lead perdido é{" "}
            <span className="text-primary not-italic font-bold">
              R$ 8.000 a R$ 40.000
            </span>{" "}
            de comissão indo embora.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomePositioning;
