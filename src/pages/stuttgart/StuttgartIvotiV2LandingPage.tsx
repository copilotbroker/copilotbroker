import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, MapPin, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";

import fachada from "@/assets/stuttgart/fachada.webp";
import piscina from "@/assets/stuttgart/piscina.webp";
import academia from "@/assets/stuttgart/academia.webp";
import coworking from "@/assets/stuttgart/coworking.webp";
import salao from "@/assets/stuttgart/salao.webp";
import duplex from "@/assets/stuttgart/duplex.webp";
import garden from "@/assets/stuttgart/garden.webp";

const STFormSection = lazy(() => import("@/components/stuttgart/STFormSection"));

const SectionFallback = () => <div className="min-h-[200px]" aria-hidden="true" />;

const scrollToForm = () => {
  document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
};

const CTAButton = ({ children }: { children: React.ReactNode }) => (
  <button
    onClick={scrollToForm}
    className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5 inline-flex items-center justify-center"
  >
    {children}
  </button>
);

const StuttgartIvotiV2LandingPage = () => {
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  usePageTracking(projectId);

  // Microsoft Clarity — carregado imediatamente
  useEffect(() => {
    if (typeof window === "undefined" || (window as any).clarity) return;
    (function (c: any, l: Document, a: string, r: string, i: string) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = 1 as any;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", "wfrjoqhzwc");
  }, []);

  useEffect(() => {
    if (submitted && typeof window !== "undefined" && (window as any).fbq) {
      ((window as any).fbq as Function)("track", "PageView");
    }
  }, [submitted]);

  // Meta Pixel — deferido
  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadPixel = () => {
      if ((window as any).fbq) return;
      (function (f: any, b: Document, e: string, v: string) {
        if (f.fbq) return;
        const n: any = (f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        const t = b.createElement(e) as HTMLScriptElement;
        t.async = !0;
        t.src = v;
        const s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      (window as any).fbq("init", "2252094488658073");
      (window as any).fbq("track", "PageView");
    };
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    if (idle) idle(loadPixel, { timeout: 3000 });
    else setTimeout(loadPixel, 1500);
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "stuttgart")
        .eq("city_slug", "ivoti")
        .single();
      if (data) setProjectId(data.id);
    };
    fetchProject();
  }, []);

  const canonicalUrl = "https://onovocondominio.com.br/ivoti/stuttgartivoti";

  const differenciais = [
    "Piscina",
    "Academia completa",
    "Coworking",
    "Espaços de convivência",
    "Área gourmet e lazer",
  ];

  const tipologias = [
    { titulo: "2 dormitórios com suíte", img: salao },
    { titulo: "3 dormitórios com suíte", img: piscina },
    { titulo: "Gardens com área externa", img: garden },
    { titulo: "Coberturas duplex", img: duplex },
  ];

  const filtros = [
    "Morar com mais qualidade de vida",
    "Garantir uma unidade antes da valorização",
    "Ter prioridade real na escolha",
  ];

  return (
    <>
      <Helmet>
        <title>Últimas Unidades · Jardins de Stuttgart | Ivoti</title>
        <meta
          name="description"
          content="Últimas unidades no Jardins de Stuttgart em Ivoti. Condomínio clube com piscina, academia, coworking e lazer. A partir de R$ 690.000. Quem entra agora tem prioridade real."
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Últimas Unidades · Jardins de Stuttgart | Ivoti" />
        <meta
          property="og:description"
          content="Condomínio clube completo em Ivoti. A partir de R$ 690.000. Garanta sua unidade antes da valorização."
        />
        <meta property="og:locale" content="pt_BR" />
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o cadastro
      </a>

      <div className="min-h-screen bg-background text-foreground">
        <main id="main-content" role="main">
          {/* 1. HERO */}
          <section
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
            aria-labelledby="hero-heading"
          >
            <img
              src={fachada}
              alt="Fachada do Residencial Jardins de Stuttgart em Ivoti"
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />

            <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
              <div className="max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 border border-primary/40 rounded-full bg-primary/10 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] sm:text-xs font-medium tracking-widest uppercase text-primary">
                    Últimas Unidades · Obras em Andamento
                  </span>
                </div>

                <h1
                  id="hero-heading"
                  className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight"
                >
                  ÚLTIMAS UNIDADES NO{" "}
                  <span className="text-gold-gradient">JARDINS DE STUTTGART</span>
                  <span className="block text-white/90 text-2xl sm:text-3xl md:text-4xl mt-2">
                    | IVOTI
                  </span>
                </h1>

                <div className="w-16 h-px bg-primary/50 mx-auto mb-6" />

                <p className="text-base sm:text-lg text-white/90 mb-4 max-w-2xl mx-auto">
                  Um condomínio clube completo para quem quer viver com{" "}
                  <strong className="text-white">conforto, lazer e valorização</strong> — todos os
                  dias.
                </p>

                <p className="text-xl sm:text-2xl text-gold-gradient font-serif font-bold mb-10">
                  💰 Unidades a partir de R$ 690.000
                </p>

                <CTAButton>VER UNIDADES DISPONÍVEIS</CTAButton>
              </div>
            </div>
          </section>

          {/* 2. ESCASSEZ */}
          <section className="py-16 sm:py-24 bg-card border-y border-primary/10" aria-labelledby="escassez-heading">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Clock className="w-10 h-10 text-primary mx-auto mb-6" />
                <h2 id="escassez-heading" className="font-serif text-2xl sm:text-4xl font-bold mb-6 text-foreground">
                  As melhores unidades já estão sendo{" "}
                  <span className="text-gold-gradient">escolhidas.</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-3">
                  Quem entra agora tem <strong className="text-foreground">prioridade real.</strong>
                </p>
                <p className="text-base sm:text-lg text-muted-foreground mb-10">
                  Quem espera… pega o que sobrar.
                </p>
                <CTAButton>QUERO VER AS OPÇÕES</CTAButton>
              </div>
            </div>
          </section>

          {/* 3. DIFERENCIAL */}
          <section className="py-20 sm:py-28 bg-background" aria-labelledby="diferencial-heading">
            <div className="container px-4">
              <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
                <div>
                  <h2 id="diferencial-heading" className="font-serif text-2xl sm:text-4xl font-bold mb-6 text-foreground">
                    Aqui você não compra só um apartamento.
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Você tem no próprio condomínio:
                  </p>
                  <ul className="space-y-3 mb-10">
                    {differenciais.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-base sm:text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <CTAButton>VER DISPONIBILIDADE</CTAButton>
                </div>
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
                  <img
                    src={piscina}
                    alt="Área de lazer do Jardins de Stuttgart"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* 4. BENEFÍCIO REAL */}
          <section className="py-16 sm:py-24 bg-card border-y border-primary/10" aria-labelledby="beneficio-heading">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Sparkles className="w-10 h-10 text-primary mx-auto mb-6" />
                <h2 id="beneficio-heading" className="font-serif text-2xl sm:text-4xl font-bold mb-8 text-foreground">
                  <span className="block mb-2">Menos deslocamento.</span>
                  <span className="block mb-2">Mais tempo com a família.</span>
                  <span className="block text-gold-gradient">
                    Mais qualidade de vida no dia a dia.
                  </span>
                </h2>
                <CTAButton>QUERO ACESSO ÀS UNIDADES</CTAButton>
              </div>
            </div>
          </section>

          {/* 5. TIPOLOGIAS */}
          <section className="py-20 sm:py-28 bg-background" aria-labelledby="tipologias-heading">
            <div className="container px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 id="tipologias-heading" className="font-serif text-2xl sm:text-4xl font-bold mb-4 text-foreground">
                    Opções para <span className="text-gold-gradient">diferentes momentos</span>
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
                  {tipologias.map((tipo) => (
                    <div
                      key={tipo.titulo}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden group"
                    >
                      <img
                        src={tipo.img}
                        alt={tipo.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                        <p className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          {tipo.titulo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <CTAButton>VER PLANTAS DISPONÍVEIS</CTAButton>
                </div>
              </div>
            </div>
          </section>

          {/* 6. LOCALIZAÇÃO */}
          <section className="py-16 sm:py-24 bg-card border-y border-primary/10" aria-labelledby="localizacao-heading">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto text-center">
                <MapPin className="w-10 h-10 text-primary mx-auto mb-6" />
                <h2 id="localizacao-heading" className="font-serif text-2xl sm:text-4xl font-bold mb-4 text-foreground">
                  Ivoti
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-8">
                  Uma das cidades com{" "}
                  <strong className="text-foreground">melhor qualidade de vida do RS</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  {["Região valorizada", "Tranquilidade", "Fácil acesso"].map((item) => (
                    <div
                      key={item}
                      className="px-4 py-3 rounded-lg bg-background border border-border/50 text-foreground text-sm sm:text-base"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <CTAButton>VER UNIDADES</CTAButton>
              </div>
            </div>
          </section>

          {/* 7. PREÇO + ANCORAGEM */}
          <section className="py-20 sm:py-28 bg-background" aria-labelledby="preco-heading">
            <div className="container px-4">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                  Unidades a partir de
                </p>
                <p
                  id="preco-heading"
                  className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-gold-gradient mb-10"
                >
                  R$ 690.000
                </p>
                <div className="space-y-3 mb-10">
                  <p className="text-base sm:text-lg text-foreground">
                    📊 Condições facilitadas na fase de obra
                  </p>
                  <p className="text-base sm:text-lg text-foreground">
                    📊 Alto potencial de valorização
                  </p>
                </div>
                <CTAButton>QUERO RECEBER CONDIÇÕES</CTAButton>
              </div>
            </div>
          </section>

          {/* 8. FILTRO FORTE */}
          <section className="py-16 sm:py-24 bg-card border-y border-primary/10" aria-labelledby="filtro-heading">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 id="filtro-heading" className="font-serif text-2xl sm:text-4xl font-bold mb-6 text-foreground">
                  Esse acesso <span className="text-gold-gradient">não é para curiosos.</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-8">
                  Preencha apenas se você quer:
                </p>
                <ul className="space-y-3 max-w-md mx-auto mb-10 text-left">
                  {filtros.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base sm:text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground italic">
                  As unidades mudam com frequência.
                </p>
              </div>
            </div>
          </section>

          {/* 9. FORMULÁRIO FINAL */}
          <Suspense fallback={<SectionFallback />}>
            <STFormSection projectId={projectId} submitted={submitted} />
          </Suspense>
        </main>

        {/* Footer minimal */}
        <footer className="py-10 bg-card border-t border-border/50">
          <div className="container px-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              © {new Date().getFullYear()} Enove Imobiliária. Todos os direitos reservados.
            </p>
            <p className="text-[11px] text-muted-foreground/80 max-w-2xl mx-auto italic">
              Imagens meramente ilustrativas. Projeto sujeito a aprovação dos órgãos competentes.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default StuttgartIvotiV2LandingPage;
