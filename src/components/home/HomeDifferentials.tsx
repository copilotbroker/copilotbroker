import { useEffect, useRef, useState } from "react";
import { Repeat, Bot, Calendar } from "lucide-react";

const cards = [
  {
    icon: Repeat,
    title: "Cadência validada",
    desc: "7 toques em 10 dias, no timing certo. 100% dos leads ativados.",
    extra: "O follow-up roda até levantar a primeira oportunidade.",
  },
  {
    icon: Bot,
    title: "Roda sozinho",
    desc: "Você foca em visita e fechamento. O motor não para.",
    extra: "Sem precisar lembrar, anotar ou abrir planilha.",
  },
  {
    icon: Calendar,
    title: "Mais visitas",
    desc: "O pipeline enche enquanto você vende.",
    extra: "Cada lead retorna no momento de comprar.",
  },
];

const HomeDifferentials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => e.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) o.observe(sectionRef.current);
    return () => o.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 px-4 bg-[#0a0a0f]"
      aria-labelledby="diff-heading"
    >
      <div className="container max-w-5xl">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Nasceu dentro de uma imobiliária
          </span>
          <h2
            id="diff-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
          >
            Uma metodologia que nossos corretores{" "}
            <span className="text-primary">viciaram</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            Percebemos que nossos melhores corretores não eram os mais talentosos.
            Eram os que <strong className="text-white">não paravam de fazer follow-up</strong>.
          </p>
          <p className="text-white/65 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mt-4">
            Então criamos um processo interno de <strong className="text-primary">7 toques estratégicos em 10 dias</strong> e
            automatizamos tudo. O resultado? Corretores que antes fechavam 1 venda passaram
            a fechar 3 a 4 no mesmo período.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {cards.map(({ icon: Icon, title, desc, extra }, i) => (
            <article
              key={title}
              className={`p-6 rounded-xl bg-[#111114] border border-[#1e1e22] hover:border-primary/40 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${150 + i * 120}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-white mb-2">{title}</h3>
              <p className="text-white/75 text-sm mb-3 leading-relaxed">{desc}</p>
              <p className="text-white/55 text-xs leading-relaxed border-t border-[#1e1e22] pt-3">
                {extra}
              </p>
            </article>
          ))}
        </div>

        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-xl bg-[#111114] border border-[#1e1e22] text-center">
          <p className="text-white/70 text-base sm:text-lg mb-3">O lead diz:</p>
          <p className="font-serif italic text-xl sm:text-2xl text-white/90 mb-4">
            "Só estou pesquisando"
          </p>
          <p className="text-primary font-bold text-base sm:text-lg mb-4">
            7 toques depois: <span className="text-white">"Quando posso visitar?"</span>
          </p>
          <p className="text-white/60 text-sm">
            E tudo isso acontece <strong className="text-white">sem você mexer um dedo</strong>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomeDifferentials;
