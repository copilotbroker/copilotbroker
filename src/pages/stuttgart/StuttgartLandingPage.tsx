import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  STHeader,
  STHeroSection,
  STAboutSection,
  STClubSection,
  STIntelligenceSection,
  STPlantsSection,
  STQualityOfLifeSection,
  STTargetSection,
  STUrgencySection,
  STBenefitsSection,
  STCallToActionSection,
  STFormSection,
  STFloatingCTA,
  STFooter,
} from "@/components/stuttgart";

const StuttgartLandingPage = () => {
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  usePageTracking(projectId);

  useEffect(() => {
    if (submitted && typeof window !== "undefined" && window.fbq) {
      (window.fbq as Function)("track", "PageView");
    }
  }, [submitted]);

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
        <meta name="description" content="Residencial Jardins de Stuttgart em Ivoti. Condomínio clube com piscina, academia, coworking e lazer completo. 2 e 3 dormitórios e coberturas duplex. Unidades a partir de R$ 634.664." />
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
        </main>
        <STFloatingCTA />
        <STFooter />
      </div>
    </>
  );
};

export default StuttgartLandingPage;
