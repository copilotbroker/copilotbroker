import { useEffect, useRef, useState } from "react";
import { Quote, TrendingUp } from "lucide-react";

const HomePartnership = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => e.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) o.observe(sectionRef.current);
    return () => o.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 px-4 bg-[#0a0a0f]"
      aria-labelledby="partnership-heading"
    >
      <div
        className={`container max-w-5xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Authority */}
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Criado por quem vende de verdade
          </span>
          <h2
            id="partnership-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          >
            Desenvolvido dentro de uma imobiliária que fez:
          </h2>

          <div className="inline-flex items-center gap-4 px-8 py-6 rounded-2xl bg-[#111114] border-2 border-primary/40 shadow-[0_0_60px_hsl(var(--primary)/0.2)]">
            <TrendingUp className="w-10 h-10 text-primary" aria-hidden="true" />
            <div className="text-left">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-primary">
                +400 milhões
              </p>
              <p className="text-white/70 text-sm sm:text-base">de VGV</p>
            </div>
          </div>

          <p className="text-white/70 text-base sm:text-lg mt-8 max-w-2xl mx-auto">
            O Copilot Broker nasceu porque{" "}
            <strong className="text-white">follow-up manual não escala.</strong>
          </p>
          <p className="font-serif text-2xl sm:text-3xl text-primary italic mt-3">
            Sistema escala.
          </p>
        </div>

        {/* Testimonial */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Corretores de imobiliária
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            Quem usa, não larga mais
          </h3>
        </div>

        <article className="max-w-2xl mx-auto p-8 rounded-xl bg-[#111114] border border-[#1e1e22] relative">
          <Quote
            className="absolute top-6 right-6 w-10 h-10 text-primary/20"
            aria-hidden="true"
          />
          <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-6 font-serif italic">
            "Eu achava que precisava de mais leads. Na real, eu só precisava parar de
            abandonar os que já tinha. O Copilot Broker faz isso por mim, no automático.
            Algo tão simples mudou completamente meu resultado."
          </p>
          <div className="flex items-center gap-4 border-t border-[#1e1e22] pt-5">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">RM</span>
            </div>
            <div>
              <p className="text-white font-semibold">Rafael Mendes</p>
              <p className="text-white/55 text-sm">Corretor de imobiliária</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default HomePartnership;
