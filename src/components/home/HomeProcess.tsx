import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5551997010323?text=Quero%20saber%20mais%20sobre%20o%20Copilot%20Broker";

const steps = [
  {
    number: "01",
    title: "Conecta seu WhatsApp",
    desc: "Em 10 minutos seu número está plugado, com QR Code ou pareamento. Sem perder histórico.",
  },
  {
    number: "02",
    title: "IA assume o atendimento",
    desc: "O copiloto responde, qualifica perfil, agenda visita e distribui pra equipe certa — 24h por dia.",
  },
  {
    number: "03",
    title: "Você fecha mais negócio",
    desc: "Corretor recebe lead pronto, com contexto e horário marcado. É só ir e bater o martelo.",
  },
];

const HomeProcess = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
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
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-5">
            Como funciona
          </span>
          <h2
            id="process-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Em <span className="text-primary">3 passos</span> sua imobiliária está
            faturando mais
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {steps.map(({ number, title, desc }, i) => (
            <article
              key={number}
              className={`relative p-7 rounded-xl bg-[#111114] border border-[#1e1e22] transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              <span
                className="block font-serif text-6xl font-bold text-primary mb-4 leading-none"
                aria-hidden="true"
              >
                {number}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-white mb-3">
                {title}
              </h3>
              <p className="text-white/65 text-sm sm:text-base leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>

        <div className="text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_60px_hsl(var(--primary)/0.5)] hover:scale-[1.03] transition-all"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            QUERO ATIVAR O COPILOT NA MINHA IMOBILIÁRIA
          </a>
          <p className="text-white/50 text-xs mt-3">Resposta em até 5 minutos no WhatsApp</p>
        </div>
      </div>
    </section>
  );
};

export default HomeProcess;
