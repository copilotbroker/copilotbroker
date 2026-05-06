import { useEffect, useRef, useState } from "react";
import { MessageCircle, AlertTriangle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5551997010323?text=Quero%20saber%20mais%20sobre%20o%20Copilot%20Broker";

const faqs = [
  {
    q: "Funciona com o WhatsApp que eu já uso?",
    a: "Sim. Conectamos seu número atual via QR Code ou pareamento numérico. Você não perde histórico nem precisa avisar seus clientes.",
  },
  {
    q: "Vou precisar contratar TI ou desenvolvedor?",
    a: "Não. Nossa equipe faz todo o setup em até 24h e treina sua equipe ao vivo. É plug-and-play.",
  },
  {
    q: "E se eu não gostar?",
    a: "7 dias de garantia incondicional. Não funcionou? Devolvemos 100% do valor sem perguntas.",
  },
  {
    q: "Quantos corretores posso colocar?",
    a: "Planos a partir de 3 corretores, sem limite máximo. Crescemos junto com sua imobiliária.",
  },
];

const HomeCTA = () => {
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
        {/* FAQ */}
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white text-center mb-8">
          Perguntas que todo dono de imobiliária faz:
        </h3>
        <div className="space-y-3 mb-16">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group p-5 rounded-xl bg-[#111114] border border-[#1e1e22] [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold text-base sm:text-lg">
                {f.q}
                <span
                  className="text-primary text-2xl group-open:rotate-45 transition-transform"
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

        {/* Urgency + final CTA */}
        <div className="text-center p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#111114] to-[#0a0a0f] border-2 border-primary/40">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-destructive/15 border border-destructive/40">
            <AlertTriangle className="w-4 h-4 text-destructive" aria-hidden="true" />
            <span className="text-destructive text-xs font-bold uppercase tracking-wider">
              Vagas limitadas este mês
            </span>
          </div>

          <h2
            id="cta-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
          >
            Cada dia sem o Copilot,{" "}
            <span className="text-primary">leads vão pra concorrência</span>
          </h2>

          <p className="text-white/75 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Aceitamos apenas <strong className="text-white">10 novas imobiliárias por mês</strong> para garantir setup e treinamento de qualidade. Quando lotar, fecha.
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_80px_hsl(var(--primary)/0.6)] hover:scale-[1.03] transition-all"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            GARANTIR MINHA VAGA NO WHATSAPP
          </a>
          <p className="text-white/50 text-xs mt-4">
            Resposta em até 5 minutos · Atendimento humano
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomeCTA;
