import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, MessageCircle, Lock } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5551997010323?text=Quero%20o%20Copilot%20Broker%20agora";

const included = [
  "1 acesso completo",
  "CRM pronto para qualquer carteira de imóveis",
  "IA no WhatsApp fazendo follow-up por você",
  "Landing page automática conectada ao CRM",
  "Onboarding de 30 min para sair rodando",
  "30 dias de acesso",
];

const HomePlatform = () => {
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
      className="py-16 sm:py-20 px-4 bg-[#0f0f12]"
      aria-labelledby="platform-heading"
    >
      <div
        className={`container max-w-5xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Math */}
        <div className="text-center mb-14">
          <h2
            id="platform-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
          >
            Vamos falar de <span className="text-primary">matemática simples</span>
          </h2>
          <div className="inline-grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl">
            {[
              { v: "R$ 400.000", l: "1 imóvel" },
              { v: "5%", l: "comissão" },
              { v: "R$ 20.000", l: "no bolso" },
            ].map((m, i) => (
              <div
                key={m.v}
                className={`p-5 rounded-xl bg-[#111114] border ${
                  i === 2 ? "border-primary/50" : "border-[#1e1e22]"
                }`}
              >
                <p
                  className={`font-serif text-xl sm:text-2xl md:text-3xl font-bold ${
                    i === 2 ? "text-primary" : "text-white"
                  }`}
                >
                  {m.v}
                </p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">{m.l}</p>
              </div>
            ))}
          </div>
          <p className="text-white/75 text-base sm:text-lg mt-8 max-w-2xl mx-auto">
            Se ele gerar <strong className="text-white">1 venda extra no trimestre</strong>,
            ele já se paga múltiplas vezes.
          </p>
          <p className="text-primary text-base sm:text-lg mt-2 font-semibold">
            Se gerar consistência mensal, vira multiplicador.
          </p>
        </div>

        {/* Offer */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Oferta para corretores
          </span>
        </div>

        <div className="rounded-2xl bg-[#111114] border-2 border-primary/40 p-8 sm:p-12 shadow-[0_0_80px_hsl(var(--primary)/0.2)] text-center">
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            Copilot Broker
          </h3>

          <div className="my-8">
            <p className="font-serif text-5xl sm:text-6xl font-bold text-primary">R$ 97</p>
            <p className="text-white/70 text-sm sm:text-base mt-2">pagamento único</p>
          </div>

          <ul className="space-y-3 max-w-md mx-auto text-left mb-10" role="list">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-white/85 text-sm sm:text-base">{item}</span>
              </li>
            ))}
          </ul>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_60px_hsl(var(--primary)/0.5)] hover:scale-[1.03] transition-all"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            Começar agora
          </a>

          <p className="text-white/55 text-xs sm:text-sm mt-4">
            Método de pagamento: cartão de crédito ou pix
          </p>

          {/* Guarantee */}
          <div className="mt-10 p-6 rounded-xl bg-primary/5 border border-primary/30 flex items-start gap-4 text-left max-w-2xl mx-auto">
            <div className="shrink-0 w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-bold text-white mb-2">
                Garantia de 30 dias
              </h4>
              <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-2">
                Se você não gostar, devolvemos seu dinheiro.
              </p>
              <p className="text-white/65 text-sm">
                Você cancela com um clique, sem dificuldade nenhuma.
              </p>
            </div>
          </div>
        </div>

        {/* Google compliance kept (small) */}
        <div className="mt-10 rounded-xl border border-[#1e1e22] bg-[#111114] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-2">
            <Lock className="w-4 h-4 text-primary mt-1 shrink-0" aria-hidden="true" />
            <h3 className="text-white font-semibold text-sm sm:text-base">
              Transparência no uso de dados
            </h3>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            O Copilot Broker pode solicitar acesso ao{" "}
            <strong className="text-white">Google Calendar</strong> exclusivamente para
            sincronizar agendamentos. Em conformidade com a{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Política de Dados de Usuário das APIs do Google
            </a>
            . Veja nossa{" "}
            <a href="/privacidade" className="text-primary underline hover:text-primary/80">
              Política de Privacidade
            </a>{" "}
            e{" "}
            <a href="/termos" className="text-primary underline hover:text-primary/80">
              Termos de Uso
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomePlatform;
