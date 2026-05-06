import { useEffect, useRef, useState } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Em 60 dias dobramos o número de visitas agendadas. O copiloto qualifica melhor que metade dos meus corretores.",
    name: "Carlos M.",
    role: "Diretor — Imobiliária em Porto Alegre",
    metric: "+112% visitas/mês",
  },
  {
    quote:
      "Eu não respondia mais lead às 22h. Hoje fecho contrato de cliente que entrou no domingo de madrugada.",
    name: "Juliana R.",
    role: "Corretora autônoma — Caxias do Sul",
    metric: "R$ 84k em 1 lançamento",
  },
  {
    quote:
      "Cortei a planilha do Excel, o WhatsApp pessoal de cada corretor e ainda economizei o salário de uma SDR.",
    name: "Vinicius B.",
    role: "Gerente — Imobiliária em Estância Velha",
    metric: "ROI em 22 dias",
  },
];

const HomePartnership = () => {
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
      className="py-16 sm:py-20 px-4 bg-[#0a0a0f]"
      aria-labelledby="partnership-heading"
    >
      <div className="container max-w-6xl">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Quem usa, não larga
          </span>
          <h2
            id="partnership-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Mais de <span className="text-primary">200 corretores</span> já automatizaram
            seu WhatsApp
          </h2>
          <div
            className="flex items-center justify-center gap-2 mt-5"
            aria-label="Avaliação 4.9 de 5"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-primary text-primary" aria-hidden="true" />
            ))}
            <span className="text-white/70 ml-2 text-sm">
              4.9/5 · avaliação dos clientes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <article
              key={t.name}
              className={`relative p-7 rounded-xl bg-[#111114] border border-[#1e1e22] transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              <Quote
                className="absolute top-5 right-5 w-8 h-8 text-primary/20"
                aria-hidden="true"
              />
              <div className="inline-block px-3 py-1 rounded-md bg-primary/15 text-primary text-xs font-bold mb-4">
                {t.metric}
              </div>
              <p className="text-white/90 text-base leading-relaxed mb-6 font-serif italic">
                "{t.quote}"
              </p>
              <div className="border-t border-[#1e1e22] pt-4">
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-white/55 text-xs">{t.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomePartnership;
