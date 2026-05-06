import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, Gift, Lock, MessageCircle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5551997010323?text=Quero%20saber%20mais%20sobre%20o%20Copilot%20Broker";

const included = [
  "WhatsApp oficial integrado (instância dedicada)",
  "IA copiloto Gemini com atendimento 24/7",
  "Roleta automática de leads entre corretores",
  "Cadência anti-perda (1d, 3d, 7d, 15d)",
  "CRM Kanban com funil customizável",
  "Dashboard de performance ao vivo",
  "Sincronização com Google Calendar",
  "Inbox unificado para toda a equipe",
  "Suporte humano e treinamento incluso",
];

const bonus = [
  { title: "Bônus #1", desc: "Setup completo feito pela nossa equipe (R$ 1.997 grátis)" },
  { title: "Bônus #2", desc: "Migração da sua base atual de leads (R$ 997 grátis)" },
  { title: "Bônus #3", desc: "Treinamento ao vivo da equipe (R$ 1.497 grátis)" },
];

const HomePlatform = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
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
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            A oferta completa
          </span>
          <h2
            id="platform-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Tudo que você precisa pra <span className="text-primary">vender mais</span>{" "}
            em um só lugar
          </h2>
        </div>

        {/* Offer card */}
        <div className="rounded-2xl bg-[#111114] border-2 border-primary/40 p-6 sm:p-10 shadow-[0_0_80px_hsl(var(--primary)/0.15)]">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-serif text-2xl font-bold text-white mb-5">
                Você recebe:
              </h3>
              <ul className="space-y-3" role="list">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-white/85 text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-white mb-5 flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" aria-hidden="true" />
                Bônus exclusivos:
              </h3>
              <ul className="space-y-3 mb-8" role="list">
                {bonus.map((b) => (
                  <li
                    key={b.title}
                    className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <p className="text-primary font-bold text-sm mb-1">{b.title}</p>
                    <p className="text-white/80 text-sm">{b.desc}</p>
                  </li>
                ))}
              </ul>

              <div className="text-center p-5 rounded-lg bg-[#0a0a0f] border border-[#1e1e22]">
                <p className="text-white/60 text-sm mb-1">Valor total dos bônus</p>
                <p className="text-2xl font-bold text-primary line-through opacity-60">
                  R$ 4.491
                </p>
                <p className="text-white font-bold text-lg mt-1">GRÁTIS hoje</p>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-10 p-6 rounded-xl bg-primary/5 border border-primary/30 flex items-start gap-4">
            <div className="shrink-0 w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-bold text-white mb-2">
                Garantia incondicional de 7 dias
              </h4>
              <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                Teste o Copilot Broker por 7 dias. Se não dobrar sua produtividade no
                WhatsApp, devolvemos 100% do valor. <strong className="text-white">Sem perguntas, sem burocracia.</strong>
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_60px_hsl(var(--primary)/0.5)] hover:scale-[1.03] transition-all"
            >
              <MessageCircle className="w-6 h-6" aria-hidden="true" />
              QUERO ATIVAR AGORA NO WHATSAPP
            </a>
            <p className="text-white/50 text-xs mt-3">
              ✓ Sem cartão &nbsp;·&nbsp; ✓ Setup em 24h &nbsp;·&nbsp; ✓ Cancela quando quiser
            </p>
          </div>
        </div>

        {/* Google compliance — kept for verification */}
        <div className="mt-10 rounded-xl border border-[#1e1e22] bg-[#111114] p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-3">
            <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <h3 className="text-white font-semibold text-base sm:text-lg">
              Transparência no uso de dados
            </h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-white/65 leading-relaxed">
            <p>
              A plataforma Copilot Broker solicita acesso ao{" "}
              <strong className="text-white">Google Calendar</strong> dos corretores
              exclusivamente para sincronizar agendamentos de visitas. O acesso é opcional
              e pode ser revogado a qualquer momento.
            </p>
            <p>
              O uso de dados das APIs do Google segue a{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Política de Dados de Usuário dos Serviços de API do Google
              </a>
              , incluindo os requisitos de uso limitado. Consulte nossa{" "}
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
      </div>
    </section>
  );
};

export default HomePlatform;
