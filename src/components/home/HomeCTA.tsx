import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5551982227001?text=Quero%20o%20Copilot%20Broker%20agora";

const faqs = [
  {
    q: "O que é o Copilot Broker?",
    a: "É um sistema completo para corretores: CRM, landing page automática e IA no WhatsApp que executa a cadência 10D — 7 contatos de follow-up em 10 dias por lead. Tudo no piloto automático.",
  },
  {
    q: "O que é a cadência 10D?",
    a: "É a metodologia validada que criamos dentro da nossa imobiliária: 7 contatos estratégicos em 10 dias, no timing certo, para reativar leads que parariam de responder no 2º contato.",
  },
  {
    q: "Preciso ter conhecimento técnico?",
    a: "Não. Em 30 minutos de onboarding você está rodando. Cria a landing page pelo celular, conecta o WhatsApp e pronto.",
  },
  {
    q: "Funciona para qualquer tipo de imóvel?",
    a: "Sim. Lançamento, usado, pronto, alto padrão, terreno, locação. O CRM se adapta à sua carteira.",
  },
  {
    q: "Posso importar meus leads atuais?",
    a: "Sim. Você pode importar sua base de leads e jogá-los direto na cadência 10D para reativar oportunidades antigas.",
  },
  {
    q: "Quantos leads posso cadastrar?",
    a: "Sem limite. Cadastre todos os leads que quiser nos 30 dias de acesso.",
  },
  {
    q: "E se eu não gostar?",
    a: "Garantia incondicional de 30 dias. Devolvemos 100% do valor sem perguntas.",
  },
  {
    q: "Posso usar no celular?",
    a: "Sim, foi feito mobile-first. Crie landing pages, atenda leads e acompanhe o funil direto do celular.",
  },
];

const HomeCTA = () => {
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
      id="contato"
      ref={sectionRef}
      className="py-16 sm:py-20 px-4 bg-[#0a0a0f]"
      aria-labelledby="cta-heading"
    >
      <div
        className={`container max-w-3xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Decisão simples */}
        <div className="text-center mb-16 p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#111114] to-[#0a0a0f] border-2 border-primary/40">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Decisão simples
          </span>

          <h2
            id="cta-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 leading-tight"
          >
            Continuar culpando o lead
          </h2>
          <p className="font-serif text-2xl sm:text-3xl text-primary italic mb-8">
            ou instalar um motor que não para?
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_80px_hsl(var(--primary)/0.6)] hover:scale-[1.03] transition-all"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            Quero o Copilot Broker agora
          </a>

          <p className="text-white/55 text-xs sm:text-sm mt-4">
            Garantia de 30 dias · Cartão de crédito ou pix
          </p>
        </div>

        {/* FAQ */}
        <div className="text-center mb-10">
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            Dúvidas Frequentes
          </h3>
          <p className="text-white/65 text-sm sm:text-base">
            Tudo que você precisa saber antes de começar
          </p>
        </div>

        <div className="space-y-3 mb-12">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group p-5 rounded-xl bg-[#111114] border border-[#1e1e22] [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold text-sm sm:text-base list-none">
                {f.q}
                <span
                  className="text-primary text-2xl group-open:rotate-45 transition-transform shrink-0 ml-3"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-white/70 text-sm sm:text-base leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        {/* Final WhatsApp */}
        <div className="text-center">
          <p className="text-white/80 text-base sm:text-lg mb-5">
            Ainda tem alguma dúvida?
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-7 py-4 rounded-xl border-2 border-primary/40 bg-primary/10 text-primary font-bold text-sm sm:text-base hover:bg-primary/20 transition-all"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            Fale com a gente no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default HomeCTA;
