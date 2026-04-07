import { useEffect, useRef, useState } from "react";
import { Calendar, Shield, BarChart3, MessageCircle, Lock } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "CRM Imobiliário Inteligente",
    description:
      "Gestão completa de leads, funil de vendas e acompanhamento de métricas em tempo real para corretores e gestores.",
  },
  {
    icon: MessageCircle,
    title: "Automação de Comunicação",
    description:
      "Envio inteligente de mensagens via WhatsApp com cadências automatizadas, copiloto com IA e inbox unificado.",
  },
  {
    icon: Calendar,
    title: "Integração com Google Calendar",
    description:
      "Sincronização de agendamentos de visitas e compromissos comerciais diretamente na agenda do corretor, facilitando a organização do dia a dia.",
  },
  {
    icon: Shield,
    title: "Distribuição de Leads (Roleta)",
    description:
      "Sistema justo e automatizado de distribuição de leads entre corretores, com check-in, timeout e fallback para líderes.",
  },
];

const HomePlatform = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 px-4 bg-card/30"
      aria-labelledby="platform-heading"
    >
      <div
        className={`container max-w-5xl transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="divider-gold mx-auto mb-6" aria-hidden="true" />

        <h2
          id="platform-heading"
          className="section-title text-center mb-4"
        >
          Nossa <span className="text-primary">plataforma</span>
        </h2>

        <p className="text-center text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto mb-10 leading-relaxed">
          A Enove opera com tecnologia própria para gerenciar toda a operação comercial de lançamentos imobiliários — do primeiro contato do lead até o fechamento da venda.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`p-6 rounded-xl border border-border/50 bg-background/50 transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <Icon
                className="w-6 h-6 text-primary mb-3"
                aria-hidden="true"
              />
              <h3 className="text-foreground font-semibold text-lg mb-2">
                {title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Google Data Usage Transparency */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <h3 className="text-foreground font-semibold text-lg">
              Transparência no uso de dados
            </h3>
          </div>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              A plataforma Enove solicita acesso ao <strong className="text-foreground">Google Calendar</strong> dos corretores exclusivamente para sincronizar agendamentos de visitas e compromissos comerciais. Esse acesso é opcional e pode ser revogado a qualquer momento pelo usuário.
            </p>
            <p>
              O uso das informações obtidas por meio das APIs do Google está em total conformidade com a{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Política de Dados de Usuário dos Serviços de API do Google
              </a>
              , incluindo os requisitos de uso limitado. Não compartilhamos, vendemos ou utilizamos esses dados para qualquer finalidade diferente da sincronização de agenda.
            </p>
            <p>
              Para mais detalhes, consulte nossa{" "}
              <a href="/privacidade" className="text-primary underline hover:text-primary/80">
                Política de Privacidade
              </a>{" "}
              e nossos{" "}
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
