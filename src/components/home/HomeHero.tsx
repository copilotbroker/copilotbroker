import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import heroImg from "@/assets/copilot-hero.jpg";
import logoCopilot from "@/assets/logo-copilot.png";

const WHATSAPP_URL =
  "https://wa.me/5551982227001?text=Quero%20ativar%20meu%20Copilot%20Broker%20agora";

const HomeHero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative min-h-[90vh] flex items-center justify-center px-4 py-16 sm:py-20 overflow-hidden bg-[#0a0a0f]"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0">
          <img src={heroImg} alt="" aria-hidden="true" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-[#0a0a0f]/85 to-[#0a0a0f]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[160px]" />
        </div>

        <div
          className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <img
            src={logoCopilot}
            alt="Copilot Broker"
            className="inline-block h-36 sm:h-48 md:h-60 w-auto mb-6"
          />

          <h1
            id="hero-heading"
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
          >
            Você não precisa de mais leads. Precisa de um{" "}
            <span className="text-primary">motor que não para no 2º contato</span>.
          </h1>

          <p className="font-serif text-lg sm:text-xl md:text-2xl text-white/85 leading-relaxed max-w-3xl mx-auto mb-6">
            O parceiro dos <strong className="text-primary">corretores de imóveis</strong>.
          </p>

          <p className="text-base sm:text-lg text-white/65 max-w-3xl mx-auto mb-10 leading-relaxed">
            O mercado já decidiu: <strong className="text-white">o lead agenda depois do 6º, 7º toque</strong>. Você faz dois,
            ele não responde, e você chama de "curioso". Enquanto isso, outro corretor
            com o mesmo lead está usando a <strong className="text-white">cadência 10D validada</strong> de
            forma automática e fecha uma venda que era pra ser sua.
          </p>

          <a
            href="#vender-mais"
            className="inline-flex items-center gap-3 px-8 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-[0_0_60px_hsl(var(--primary)/0.5)] hover:scale-[1.03] transition-all"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            Quero ativar meu Copilot Broker agora
          </a>
        </div>
      </section>
    </>
  );
};

export default HomeHero;
