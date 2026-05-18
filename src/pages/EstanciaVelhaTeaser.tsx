import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FormSection from "@/components/FormSection";
import logoEnove from "@/assets/logo-enove.png";

const benefits = [
  "Condições exclusivas de lançamento",
  "Atendimento prioritário com especialistas Enove",
  "Empreendimentos selecionados com alto potencial de valorização",
  "Acesso antecipado antes do mercado aberto",
];

const EstanciaVelhaTeaser = () => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let count = 0;
        const interval = setInterval(() => {
          count++;
          setVisibleItems(count);
          if (count >= 8) clearInterval(interval);
        }, 180);
      }
    }, { threshold: 0.1 });
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase.from("projects").select("id").eq("slug", "estanciavelha").maybeSingle();
      if (data) setProjectId(data.id);
    };
    fetchProject();
  }, []);

  const itemClass = (index: number) =>
    `transition-all duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] ${
      visibleItems > index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`;

  return (
    <>
      <Helmet>
        <title>Lançamentos Imobiliários Estância Velha | Acesso Antecipado Enove</title>
        <meta name="description" content="Acesso antecipado aos próximos lançamentos imobiliários de Estância Velha. Empreendimentos de alto padrão, condições especiais de pré-lançamento e oportunidades selecionadas antes da divulgação ao mercado." />
        <link rel="canonical" href="https://onovocondominio.com.br/estanciavelha" />
        <meta property="og:title" content="Lançamentos Imobiliários Estância Velha | Acesso Antecipado Enove" />
        <meta property="og:description" content="Empreendimentos de alto padrão, condições especiais de pré-lançamento e oportunidades selecionadas antes da divulgação ao mercado." />
        <meta property="og:url" content="https://onovocondominio.com.br/estanciavelha" />
        <meta property="og:type" content="website" />
        <script type="text/javascript">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vbso39eiiq");`}
        </script>
      </Helmet>

      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 40%, hsl(48 96% 53% / 0.04) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a0d 0%, #0f0f12 40%, #0a0a0d 100%)
          `,
        }}
      >
        {/* Header */}
        <header className="relative py-8 flex justify-center">
          <a
            href="https://www.enoveimobiliaria.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 hover:opacity-100 transition-opacity duration-500"
          >
            <img src={logoEnove} alt="Enove Imobiliária" className="h-10 sm:h-12" />
          </a>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-16">
          <div ref={heroRef} className="max-w-3xl mx-auto text-center space-y-7">
            {/* Badge */}
            <div className={itemClass(0)}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-primary uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Pré-Lançamentos Exclusivos
                </span>
              </div>
            </div>

            {/* Title */}
            <div className={itemClass(1)}>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground/95 tracking-tight">
                Acesso antecipado aos próximos{" "}
                <span className="text-primary">lançamentos imobiliários</span>{" "}
                de Estância Velha
              </h1>
            </div>

            {/* Gold divider */}
            <div className={itemClass(2)}>
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary/50" />
                <div className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary/50" />
              </div>
            </div>

            {/* Subtitle */}
            <div className={itemClass(3)}>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
                Empreendimentos de alto padrão, condições especiais de pré-lançamento e oportunidades selecionadas antes da divulgação oficial ao mercado.
              </p>
            </div>

            {/* Supporting line */}
            <div className={itemClass(4)}>
              <p className="text-sm sm:text-base text-muted-foreground/80 max-w-xl mx-auto leading-relaxed">
                Cadastre-se para receber informações em primeira mão e tenha prioridade na escolha das melhores unidades.
              </p>
            </div>

            {/* Benefits list */}
            <div className={itemClass(5)}>
              <ul className="mx-auto max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-3 pt-2 text-left">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </span>
                    <span className="text-sm sm:text-[15px] text-foreground/80 leading-snug">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quote */}
            <div className={itemClass(6)}>
              <p className="text-primary font-serif italic text-xl sm:text-2xl tracking-wide pt-2">
                <span className="text-primary/40 text-3xl mr-1">"</span>
                Quem entra antes, escolhe melhor.
                <span className="text-primary/40 text-3xl ml-1">"</span>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className={`w-full max-w-lg mx-auto mt-12 ${itemClass(7)}`}>
            <FormSection projectId={projectId} projectSlug="estanciavelha" allowBrokerSelection={true} />
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 text-center">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto mb-4" />
          <p className="text-[11px] text-muted-foreground/60 tracking-widest uppercase">
            © {new Date().getFullYear()} Enove Imobiliária
          </p>
        </footer>
      </div>
    </>
  );
};

export default EstanciaVelhaTeaser;
