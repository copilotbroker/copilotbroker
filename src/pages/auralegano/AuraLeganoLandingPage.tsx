import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  ALHeader,
  ALHeroSection,
  ALAboutSection,
  ALGallerySection,
  ALProjectSection,
  ALClubSection,
  ALAdvantagesSection,
  ALNatureSection,
  ALTour360Section,
  ALLotSection,
  ALTargetSection,
  ALDeliverySection,
  ALUrgencySection,
  ALCallToActionSection,
  ALFormSection,
  ALFloatingCTA,
  ALFooter,
} from "@/components/auralegano";

const AuraLeganoLandingPage = () => {
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
        .eq("slug", "auralegano")
        .eq("city_slug", "novasantarita")
        .single();
      if (data) setProjectId(data.id);
    };
    fetchProject();
  }, []);

  const canonicalUrl = "https://onovocondominio.com.br/novasantarita/auralegano";

  return (
    <>
      <Helmet>
        <title>Aura Legano | Últimos 15 Lotes em Nova Santa Rita</title>
        <meta name="description" content="Aura Legano em Nova Santa Rita. Condomínio fechado de alto padrão com clube completo, parque linear e área verde integrada. Restam apenas 15 lotes. Entrega Julho/2026." />
        <meta name="keywords" content="loteamento Nova Santa Rita, Aura Legano, condomínio fechado, lotes Nova Santa Rita, loteamento alto padrão, terrenos em condomínio" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Aura Legano | Últimos 15 Lotes em Nova Santa Rita" />
        <meta property="og:description" content="Condomínio fechado de alto padrão. Clube completo, parque linear e mais de 200.000m² de área total. Entrega Julho/2026." />
        <meta property="og:locale" content="pt_BR" />
        <script>
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '2252094488658073');
          fbq('track', 'PageView');`}
        </script>
        <noscript>
          {`<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=2252094488658073&ev=PageView&noscript=1" />`}
        </noscript>
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o cadastro
      </a>

      <div className="min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <ALHeader />
        <main id="main-content" role="main">
          <ALHeroSection />
          <ALAboutSection />
          <ALGallerySection />
          <ALProjectSection />
          <ALClubSection />
          <ALAdvantagesSection />
          <ALNatureSection />
          <ALTour360Section />
          <ALLotSection />
          <ALTargetSection />
          <ALDeliverySection />
          <ALUrgencySection />
          <ALCallToActionSection />
          <ALFormSection projectId={projectId} submitted={submitted} />
        </main>
        <ALFloatingCTA />
        <ALFooter />
      </div>
    </>
  );
};

export default AuraLeganoLandingPage;
