import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  MonacoHeader,
  MonacoHeroSection,
  MonacoAboutSection,
  MonacoNauticoSection,
  MonacoClubSection,
  MonacoParqueSection,
  MonacoLocationSection,
  MonacoTargetSection,
  MonacoCTASection,
  MonacoFormSection,
  MonacoFooter,
  MonacoFloatingCTA,
} from "@/components/monaco";

const MonacoLandingPage = () => {
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  usePageTracking(projectId);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "monaco")
        .eq("city_slug", "xangrila")
        .single();

      if (data) {
        setProjectId(data.id);
      }
    };

    fetchProject();
  }, []);

  const canonicalUrl = "https://onovocondominio.com.br/xangrila/monaco";

  const residenceSchema = {
    "@context": "https://schema.org",
    "@type": "Residence",
    "@id": `${canonicalUrl}#residence`,
    name: "Mônaco Grand Marina",
    description: "Condomínio náutico de alto padrão na Lagoa dos Quadros, Xangri-lá. 367 lotes, canais navegáveis, marina e clube social.",
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Xangri-lá",
      addressRegion: "RS",
      addressCountry: "BR",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Canais navegáveis", value: true },
      { "@type": "LocationFeatureSpecification", name: "Marina privativa", value: true },
      { "@type": "LocationFeatureSpecification", name: "Clube social", value: true },
      { "@type": "LocationFeatureSpecification", name: "Parque da Orla", value: true },
    ],
    tourBookingPage: `${canonicalUrl}#cadastro`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://onovocondominio.com.br" },
      { "@type": "ListItem", position: 2, name: "Xangri-lá", item: "https://onovocondominio.com.br/xangrila" },
      { "@type": "ListItem", position: 3, name: "Mônaco Grand Marina", item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Mônaco Grand Marina | Condomínio Náutico em Xangri-lá</title>
        <meta name="title" content="Mônaco Grand Marina | Condomínio Náutico de Alto Padrão" />
        <meta name="description" content="Condomínio náutico de alto padrão na Lagoa dos Quadros, Xangri-lá. 367 lotes com canais navegáveis, marina, clube social e Parque da Orla." />
        <meta name="keywords" content="Mônaco Grand Marina, condomínio náutico Xangri-lá, lotes Lagoa dos Quadros, condomínio alto padrão litoral RS, marina club" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Enove Imobiliária" />
        <meta property="og:title" content="Mônaco Grand Marina | Condomínio Náutico em Xangri-lá" />
        <meta property="og:description" content="Condomínio náutico de alto padrão na Lagoa dos Quadros. 367 lotes, canais navegáveis e marina." />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mônaco Grand Marina | Condomínio Náutico em Xangri-lá" />
        <meta name="twitter:description" content="Condomínio náutico de alto padrão na Lagoa dos Quadros." />
        <script type="application/ld+json">{JSON.stringify(residenceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o cadastro
      </a>

      <div className="monaco-theme min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        
        <main id="main-content" role="main">
          <MonacoHeroSection />
          <MonacoAboutSection />
          <MonacoNauticoSection />
          <MonacoClubSection />
          <MonacoParqueSection />
          <MonacoLocationSection />
          <MonacoTargetSection />
          <MonacoCTASection />
          <MonacoFormSection projectId={projectId} submitted={submitted} />
        </main>
        <MonacoFloatingCTA />
        <MonacoFooter />
      </div>
    </>
  );
};

export default MonacoLandingPage;
