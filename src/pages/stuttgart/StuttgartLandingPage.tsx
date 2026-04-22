import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";

// Above-the-fold: carregado imediatamente
import { STHeader, STHeroSection } from "@/components/stuttgart";

// Below-the-fold: lazy-loaded em chunks separados (não vão para o bundle inicial)
const STAboutSection = lazy(() => import("@/components/stuttgart/STAboutSection"));
const STClubSection = lazy(() => import("@/components/stuttgart/STClubSection"));
const STIntelligenceSection = lazy(() => import("@/components/stuttgart/STIntelligenceSection"));
const STPlantsSection = lazy(() => import("@/components/stuttgart/STPlantsSection"));
const STQualityOfLifeSection = lazy(() => import("@/components/stuttgart/STQualityOfLifeSection"));
const STTargetSection = lazy(() => import("@/components/stuttgart/STTargetSection"));
const STUrgencySection = lazy(() => import("@/components/stuttgart/STUrgencySection"));
const STBenefitsSection = lazy(() => import("@/components/stuttgart/STBenefitsSection"));
const STCallToActionSection = lazy(() => import("@/components/stuttgart/STCallToActionSection"));
const STFormSection = lazy(() => import("@/components/stuttgart/STFormSection"));
const STFloatingCTA = lazy(() => import("@/components/stuttgart/STFloatingCTA"));
const STFooter = lazy(() => import("@/components/stuttgart/STFooter"));

const SectionFallback = () => <div className="min-h-[200px]" aria-hidden="true" />;

const StuttgartLandingPage = () => {
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  usePageTracking(projectId);

  useEffect(() => {
    if (submitted && typeof window !== "undefined" && (window as any).fbq) {
      ((window as any).fbq as Function)("track", "PageView");
    }
  }, [submitted]);

  // Carrega scripts de tracking (Pixel + Clarity) somente após o navegador ficar ocioso,
  // evitando bloquear o LCP do Hero.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadTracking = () => {
      // Meta Pixel
      if (!(window as any).fbq) {
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
      }

      // Microsoft Clarity
      if (!(window as any).clarity) {
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
      }
    };

    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    if (idle) {
      idle(loadTracking, { timeout: 3000 });
    } else {
      setTimeout(loadTracking, 1500);
    }
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

  const canonicalUrl = "https://onovocondominio.com.br/ivoti/stuttgart";

  return (
    <>
      <Helmet>
        <title>Jardins de Stuttgart | Condomínio Clube em Ivoti</title>
        <meta name="description" content="Residencial Jardins de Stuttgart em Ivoti. Condomínio clube com piscina, academia, coworking e lazer completo. 2 e 3 dormitórios e coberturas duplex. Unidades a partir de R$ 690.000." />
        <meta name="keywords" content="apartamentos Ivoti, condomínio clube Ivoti, Jardins de Stuttgart, residencial Ivoti, lançamento imobiliário, 2 dormitórios Ivoti, 3 dormitórios Ivoti, cobertura duplex" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Jardins de Stuttgart | Condomínio Clube em Ivoti" />
        <meta property="og:description" content="Você não precisa mais sair de casa para viver bem. Condomínio clube completo em Ivoti." />
        <meta property="og:locale" content="pt_BR" />
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o cadastro
      </a>

      <div className="min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <STHeader />
        <main id="main-content" role="main">
          <STHeroSection />
          <Suspense fallback={<SectionFallback />}>
            <STAboutSection />
            <STClubSection />
            <STIntelligenceSection />
            <STPlantsSection />
            <STQualityOfLifeSection />
            <STTargetSection />
            <STUrgencySection />
            <STBenefitsSection />
            <STCallToActionSection />
            <STFormSection projectId={projectId} submitted={submitted} />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <STFloatingCTA />
          <STFooter />
        </Suspense>
      </div>
    </>
  );
};

export default StuttgartLandingPage;
