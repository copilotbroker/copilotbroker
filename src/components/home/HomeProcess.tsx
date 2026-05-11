import { useEffect, useRef, useState } from "react";

const steps = [
  {
    n: "01",
    title: "Crie pelo celular",
    desc: "Monte uma landing page persuasiva e personalizada para o imóvel, com formulário no final para o lead se cadastrar.",
  },
  {
    n: "02",
    title: "O lead cai no CRM",
    desc: "Cada cadastro entra organizado e pronto para o follow-up.",
  },
  {
    n: "03",
    title: "Follow-up no piloto automático",
    desc: 'Enquanto você atende seus leads quentes, o seu parceiro Copilot Broker aquece os que você chamava de "curiosos". No 7º contato, eles já estarão prontos para você vender.',
  },
];

const HomeProcess = () => {
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
      className="py-16 sm:py-20 px-4 bg-[#0f0f12]"
      aria-labelledby="process-heading"
    >
      <div className="container max-w-5xl">
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2
            id="process-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Simples assim. <span className="text-primary">3 passos.</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg">
            Sem instalação. Sem configuração. Sem dor de cabeça.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ n, title, desc }, i) => (
            <article
              key={n}
              className={`p-7 rounded-xl bg-[#111114] border border-[#1e1e22] transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              <span
                className="block font-serif text-6xl font-bold text-primary mb-4 leading-none"
                aria-hidden="true"
              >
                {n}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-white mb-3">
                {title}
              </h3>
              <p className="text-white/65 text-sm sm:text-base leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeProcess;
