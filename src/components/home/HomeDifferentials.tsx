import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, BarChart3, Shuffle, Bell, Calendar } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "IA que atende em segundos",
    desc: "Copiloto com Gemini responde, qualifica e agenda visita 24/7. Lead nunca espera resposta.",
  },
  {
    icon: Shuffle,
    title: "Roleta inteligente de leads",
    desc: "Distribui automaticamente entre corretores online. Sem briga, sem favorecimento, sem lead parado.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp oficial integrado",
    desc: "Tudo dentro do app. Histórico salvo, áudio transcrito, mídia organizada por lead.",
  },
  {
    icon: Bell,
    title: "Cadência automática anti-perda",
    desc: "Follow-up de 1, 3, 7 e 15 dias enviado sozinho. Reativa lead frio sem corretor lembrar.",
  },
  {
    icon: Calendar,
    title: "Agenda sincronizada com Google",
    desc: "Visitas viram eventos automáticos. Notificação para corretor e cliente. Zero no-show.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de performance ao vivo",
    desc: "Saiba qual corretor vende, qual canal converte e onde o dinheiro está vazando.",
  },
];

const HomeDifferentials = () => {
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
      className="py-16 sm:py-20 px-4 bg-[#0a0a0f]"
      aria-labelledby="differentials-heading"
    >
      <div className="container max-w-6xl">
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            A solução
          </span>
          <h2
            id="differentials-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            O <span className="text-primary">Copilot Broker</span> faz o trabalho que sua
            equipe não dá conta.
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-base sm:text-lg">
            Um sistema único que centraliza WhatsApp, IA, CRM, roleta e agenda — feito
            para imobiliárias que querem vender mais sem contratar mais gente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <article
              key={title}
              className={`p-6 rounded-xl bg-[#111114] border border-[#1e1e22] hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${150 + i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-white mb-2">
                {title}
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeDifferentials;
