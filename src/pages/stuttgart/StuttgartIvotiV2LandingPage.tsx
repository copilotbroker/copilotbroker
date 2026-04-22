import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  MapPin,
  Sparkles,
  Clock,
  Waves,
  Dumbbell,
  Briefcase,
  Users,
  UtensilsCrossed,
  Home,
  TreePine,
  TrendingUp,
  HandCoins,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";

import fachada from "@/assets/stuttgart/fachada.webp";
import insercao from "@/assets/stuttgart/insercao.webp";
import piscinaImg from "@/assets/stuttgart/piscina.webp";
import academiaImg from "@/assets/stuttgart/academia.webp";
import coworkingImg from "@/assets/stuttgart/coworking.webp";
import salaoImg from "@/assets/stuttgart/salao.webp";
import jacuzziImg from "@/assets/stuttgart/jacuzzi.webp";
import estarImg from "@/assets/stuttgart/estar.webp";

const STFormSection = lazy(() => import("@/components/stuttgart/STFormSection"));

const infraestrutura = [
  { src: piscinaImg, alt: "Piscina externa com solarium", caption: "Piscina" },
  { src: academiaImg, alt: "Academia equipada do condomínio", caption: "Academia completa" },
  { src: coworkingImg, alt: "Coworking equipado", caption: "Coworking" },
  { src: salaoImg, alt: "Salão de festas do condomínio", caption: "Salão de festas" },
  { src: jacuzziImg, alt: "Jacuzzi externa", caption: "Jacuzzi" },
  { src: estarImg, alt: "Estar externo com fireplace", caption: "Estar externo · Fireplace" },
];

const SectionFallback = () => <div className="min-h-[200px]" aria-hidden="true" />;

const scrollToForm = () => {
  document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
};

const CTAButton = ({ children, ariaLabel }: { children: React.ReactNode; ariaLabel?: string }) => (
  <button
    onClick={scrollToForm}
    className="btn-primary text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5"
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

/** Hook compacto para reaproveitar o padrão de fade-in do Stuttgart original */
const useReveal = (threshold = 0.15) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
};

const StuttgartIvotiV2LandingPage = () => {
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [heroVisible, setHeroVisible] = useState(false);

  usePageTracking(projectId);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  // Microsoft Clarity — primeiro de tudo
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

  // Meta Pixel deferido
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

  // Seções com reveal padrão Stuttgart
  const escassez = useReveal();
  const diferencial = useReveal();
  const beneficio = useReveal();
  const tipologias = useReveal(0.1);
  const localizacao = useReveal();
  const preco = useReveal();
  const filtro = useReveal();

  const diferenciais = [
    { icon: Waves, text: "Piscina" },
    { icon: Dumbbell, text: "Academia completa" },
    { icon: Briefcase, text: "Coworking" },
    { icon: Users, text: "Espaços de convivência" },
    { icon: UtensilsCrossed, text: "Área gourmet e lazer" },
  ];

  const tipologiasList = [
    "2 dormitórios com suíte",
    "2 dormitórios com suíte e garden",
    "3 dormitórios com suíte",
    "3 dormitórios com suíte e garden",
    "Coberturas duplex com 3 dormitórios",
  ];

  const localizacaoTags = [
    { icon: TrendingUp, text: "Região valorizada" },
    { icon: TreePine, text: "Tranquilidade" },
    { icon: MapPin, text: "Fácil acesso" },
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
          {/* 1. HERO — padrão STHeroSection */}
          <section
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            aria-labelledby="hero-heading"
          >
            <img
              src={fachada}
              alt="Fachada do Residencial Jardins de Stuttgart em Ivoti"
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <div className="relative z-10 container px-4 pt-24 pb-16 text-center">
              <div
                className={`max-w-4xl mx-auto transition-all duration-1000 ${
                  heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 border border-primary/40 rounded-full bg-primary/10 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] sm:text-xs font-medium tracking-widest uppercase text-primary">
                    Últimas Unidades · Obras em Andamento
                  </span>
                </div>

                <h1
                  id="hero-heading"
                  className="font-serif text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight"
                >
                  ÚLTIMAS UNIDADES NO{" "}
                  <span className="text-gold-gradient">JARDINS DE STUTTGART</span>
                  <span className="block text-white/90 text-2xl sm:text-3xl md:text-4xl mt-3">
                    | IVOTI
                  </span>
                </h1>

                <div className="w-16 h-px bg-primary/50 mx-auto mb-8" />

                <p className="text-sm sm:text-base text-white/80 mb-3 max-w-2xl mx-auto">
                  Um condomínio clube completo para quem quer viver com conforto, lazer e
                  valorização — todos os dias.
                </p>
                <p className="text-base sm:text-lg text-white font-serif italic mb-10 max-w-2xl mx-auto">
                  Unidades a partir de <span className="text-gold-gradient not-italic font-bold">R$ 690.000</span>
                </p>

                <CTAButton ariaLabel="Ver unidades disponíveis">
                  Ver Unidades Disponíveis
                </CTAButton>
              </div>
            </div>
          </section>

          {/* 2. ESCASSEZ — padrão STUrgencySection (bg-card + linhas douradas) */}
          <section
            ref={escassez.ref as React.RefObject<HTMLElement>}
            className="py-20 md:py-32 bg-card relative overflow-hidden"
            aria-labelledby="escassez-heading"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="container px-4 relative z-10">
              <div
                className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${
                  escassez.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-primary" />
                </div>

                <h2
                  id="escassez-heading"
                  className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                >
                  AS MELHORES UNIDADES JÁ ESTÃO SENDO{" "}
                  <span className="text-gold-gradient">ESCOLHIDAS</span>
                </h2>

                <div className="divider-gold mx-auto my-8" />

                <p className="text-base sm:text-lg text-muted-foreground mb-3 leading-relaxed">
                  Quem entra agora tem{" "}
                  <strong className="text-foreground">prioridade real.</strong>
                </p>
                <p className="font-serif text-xl md:text-2xl italic text-foreground mb-10">
                  Quem espera… pega o que sobrar.
                </p>

                <CTAButton ariaLabel="Quero ver as opções">Quero Ver as Opções</CTAButton>
              </div>
            </div>
          </section>

          {/* 3. DIFERENCIAL — padrão STAboutSection (cards-luxury com ícones) */}
          <section
            ref={diferencial.ref as React.RefObject<HTMLElement>}
            className="py-20 md:py-32 bg-background relative overflow-hidden"
            aria-labelledby="diferencial-heading"
          >
            <div className="container px-4 relative z-10">
              <div
                className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
                  diferencial.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <h2
                  id="diferencial-heading"
                  className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                >
                  AQUI VOCÊ NÃO COMPRA SÓ{" "}
                  <span className="text-gold-gradient">UM APARTAMENTO</span>
                </h2>

                <p className="text-base sm:text-lg text-muted-foreground mb-12 leading-relaxed">
                  Você tem no próprio condomínio:
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-12">
                  {diferenciais.map((item, index) => (
                    <div
                      key={item.text}
                      className={`card-luxury p-5 text-center transition-all duration-700 ${
                        diferencial.isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-10"
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xs sm:text-sm text-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>

                <CTAButton ariaLabel="Ver disponibilidade">Ver Disponibilidade</CTAButton>
              </div>
            </div>
          </section>

          {/* 4. BENEFÍCIO REAL — padrão STUrgencySection */}
          <section
            ref={beneficio.ref as React.RefObject<HTMLElement>}
            className="py-20 md:py-32 bg-card relative overflow-hidden"
            aria-labelledby="beneficio-heading"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

            <div className="container px-4 relative z-10">
              <div
                className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${
                  beneficio.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>

                <h2
                  id="beneficio-heading"
                  className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
                >
                  <span className="block mb-3 text-foreground">Menos deslocamento.</span>
                  <span className="block mb-3 text-foreground">Mais tempo com a família.</span>
                  <span className="block text-gold-gradient">
                    Mais qualidade de vida no dia a dia.
                  </span>
                </h2>

                <div className="divider-gold mx-auto my-8" />

                <CTAButton ariaLabel="Quero acesso às unidades">
                  Quero Acesso às Unidades
                </CTAButton>
              </div>
            </div>
          </section>

          {/* 5. TIPOLOGIAS — padrão STPlantsSection (lista com ícone Home) */}
          <section
            ref={tipologias.ref as React.RefObject<HTMLElement>}
            id="plantas"
            className="py-20 md:py-32 bg-background relative overflow-hidden"
            aria-labelledby="tipologias-heading"
          >
            <div className="container px-4 relative z-10">
              <div
                className={`text-center mb-12 transition-all duration-1000 ${
                  tipologias.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <h2
                  id="tipologias-heading"
                  className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                >
                  PLANTAS PARA{" "}
                  <span className="text-gold-gradient">DIFERENTES MOMENTOS DA VIDA</span>
                </h2>
                <p className="text-muted-foreground">
                  Escolha o espaço que faz sentido para você:
                </p>
              </div>

              <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 mb-12">
                {tipologiasList.map((plant, index) => (
                  <div
                    key={plant}
                    className={`flex items-center gap-4 p-5 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-500 ${
                      tipologiasList.length % 2 !== 0 && index === tipologiasList.length - 1
                        ? "sm:col-span-2 sm:max-w-md sm:mx-auto sm:w-full"
                        : ""
                    } ${
                      tipologias.isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-5"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Home className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-foreground">
                      <span className="text-primary mr-2">✔</span>
                      {plant}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <CTAButton ariaLabel="Ver plantas disponíveis">Ver Plantas Disponíveis</CTAButton>
              </div>
            </div>
          </section>


          {/* 6. LOCALIZAÇÃO — padrão STAboutSection (bg-card + linhas) */}
          <section
            ref={localizacao.ref as React.RefObject<HTMLElement>}
            className="py-20 md:py-32 bg-card relative overflow-hidden"
            aria-labelledby="localizacao-heading"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="container px-4 relative z-10">
              <div
                className={`max-w-5xl mx-auto transition-all duration-1000 ${
                  localizacao.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div className="text-center lg:text-left">
                    <div className="w-14 h-14 mb-6 rounded-full bg-primary/10 flex items-center justify-center mx-auto lg:mx-0">
                      <MapPin className="w-7 h-7 text-primary" />
                    </div>

                    <h2
                      id="localizacao-heading"
                      className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                    >
                      <span className="text-gold-gradient">IVOTI</span>
                    </h2>

                    <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                      Uma das cidades com{" "}
                      <strong className="text-foreground">melhor qualidade de vida do RS</strong>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                      {localizacaoTags.map((tag) => (
                        <div
                          key={tag.text}
                          className="flex items-center justify-center lg:justify-start gap-2 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-300"
                        >
                          <tag.icon className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground">{tag.text}</span>
                        </div>
                      ))}
                    </div>

                    <CTAButton ariaLabel="Ver unidades">Ver Unidades</CTAButton>
                  </div>

                  <div className="relative">
                    <div className="relative rounded-lg overflow-hidden shadow-elegant aspect-[4/3]">
                      <img
                        src={insercao}
                        alt="Vista aérea de Ivoti com o Jardins de Stuttgart inserido na paisagem"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="absolute -inset-2 border border-primary/20 rounded-lg -z-10" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. PREÇO + ANCORAGEM — padrão card-luxury */}
          <section
            ref={preco.ref as React.RefObject<HTMLElement>}
            className="py-20 md:py-32 bg-background relative overflow-hidden"
            aria-labelledby="preco-heading"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

            <div className="container px-4 relative z-10">
              <div
                className={`max-w-2xl mx-auto transition-all duration-1000 ${
                  preco.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="card-luxury p-8 md:p-12 text-center">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-muted-foreground mb-4">
                    Unidades a partir de
                  </p>
                  <p
                    id="preco-heading"
                    className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-gold-gradient mb-2"
                  >
                    R$ 690.000
                  </p>

                  <div className="divider-gold mx-auto my-8" />

                  <div className="space-y-4 mb-10 text-left max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <HandCoins className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-base text-foreground pt-2">
                        Condições facilitadas na fase de obra
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-base text-foreground pt-2">
                        Alto potencial de valorização
                      </p>
                    </div>
                  </div>

                  <CTAButton ariaLabel="Quero receber condições">
                    Quero Receber Condições
                  </CTAButton>
                </div>
              </div>
            </div>
          </section>

          {/* 8. FILTRO FORTE — padrão STBenefitsSection */}
          <section
            ref={filtro.ref as React.RefObject<HTMLElement>}
            className="py-20 md:py-32 bg-card relative overflow-hidden"
            aria-labelledby="filtro-heading"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="container px-4 relative z-10">
              <div className="max-w-4xl mx-auto">
                <div
                  className={`text-center mb-12 transition-all duration-1000 ${
                    filtro.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                >
                  <h2
                    id="filtro-heading"
                    className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                  >
                    ESSE ACESSO NÃO É{" "}
                    <span className="text-gold-gradient">PARA CURIOSOS</span>
                  </h2>
                  <p className="font-serif text-xl md:text-2xl text-primary">
                    Preencha apenas se você quer:
                  </p>
                </div>

                <div
                  className={`grid sm:grid-cols-2 gap-4 mb-10 transition-all duration-1000 delay-200 ${
                    filtro.isVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {filtros.map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-center gap-4 p-5 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-500 ${
                        index === filtros.length - 1 ? "sm:col-span-2 sm:max-w-md sm:mx-auto sm:w-full" : ""
                      } ${filtro.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
                      style={{ transitionDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-foreground">
                        <span className="text-primary mr-1">✔</span>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-center text-sm text-muted-foreground italic">
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

        {/* Footer minimal — mantendo padrão Stuttgart */}
        <footer className="py-12 bg-card border-t border-border/50">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                <strong>Observação importante:</strong> As imagens e informações contidas neste
                material são meramente ilustrativas, podendo haver alterações sem aviso prévio.
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Enove Imobiliária. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default StuttgartIvotiV2LandingPage;
