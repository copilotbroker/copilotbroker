import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  NAUHeader,
  NAUHeroSection,
  NAUAboutSection,
  NAUMapSection,
  NAUFeaturesSection,
  NAUConditionsSection,
  NAUGallerySection,
  NAUTargetSection,
  NAUUrgencySection,
  NAUBenefitsSection,
  NAUCallToActionSection,
  NAUFormSection,
  NAUFooter,
  NAUFloatingCTA,
} from "@/components/nau";

interface Project {
  id: string;
  name: string;
  slug: string;
  webhook_url: string | null;
}

const NAULandingPage = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isThankYouPage = location.pathname === "/osorio/nau/obrigado";

  usePageTracking(project?.id);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, slug, webhook_url")
          .eq("city_slug", "osorio")
          .eq("slug", "nau")
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Error fetching project:", error);
          navigate("/");
          return;
        }
        if (!data) {
          console.error("NAU project not found");
          navigate("/");
          return;
        }
        setProject(data);
      } catch (err) {
        console.error("Error:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,35%,8%)]">
        <RefreshCw className="w-8 h-8 text-[hsl(200,60%,40%)] animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const canonicalUrl = "https://onovocondominio.com.br/osorio/nau";

  const residenceSchema = {
    "@context": "https://schema.org",
    "@type": "Residence",
    "@id": `${canonicalUrl}#residence`,
    name: "NAU Condomínio Náutico",
    description: "Condomínio náutico em Osório - RS com acesso à Lagoa do Peixoto. Lotes navegáveis, beira lago e secos. 390.000 m².",
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Osório",
      addressRegion: "RS",
      addressCountry: "BR",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Lotes navegáveis", value: true },
      { "@type": "LocationFeatureSpecification", name: "Acesso à lagoa", value: true },
      { "@type": "LocationFeatureSpecification", name: "Marina privativa", value: true },
      { "@type": "LocationFeatureSpecification", name: "Segurança 24h", value: true },
    ],
    tourBookingPage: `${canonicalUrl}#cadastro`,
  };

  return (
    <div className="min-h-screen bg-[hsl(210,35%,8%)] text-white">
      <Helmet>
        <title>NAU | Condomínio Náutico em Osório - Lagoa do Peixoto</title>
        <meta name="title" content="NAU | Condomínio Náutico em Osório" />
        <meta name="description" content="Condomínio náutico em Osório com acesso direto à Lagoa do Peixoto. Lotes navegáveis a partir de R$ 229 mil. 25% de desconto em 30x sem juros. Entrega em Out/2026." />
        <meta name="keywords" content="condomínio náutico Osório, lotes navegáveis Lagoa do Peixoto, NAU condomínio, lotes beira lago Osório RS, condomínio fechado Osório 2026" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Enove Imobiliária" />
        <meta property="og:title" content="NAU | Condomínio Náutico em Osório" />
        <meta property="og:description" content="Lotes navegáveis com acesso à Lagoa do Peixoto. A partir de R$ 229 mil com 25% de desconto." />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NAU | Condomínio Náutico em Osório" />
        <meta name="twitter:description" content="Lotes navegáveis a partir de R$ 229 mil." />
        <script type="application/ld+json">{JSON.stringify(residenceSchema)}</script>
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[hsl(200,60%,40%)] focus:text-white focus:rounded"
      >
        Ir para o cadastro
      </a>

      <NAUHeader />
      <main id="main-content" role="main">
        <NAUHeroSection />
        <NAUAboutSection />
        <NAUMapSection />
        <NAUFeaturesSection />
        <NAUGallerySection />
        <NAUConditionsSection />
        <NAUTargetSection />
        <NAUUrgencySection />
        <NAUBenefitsSection />
        <NAUCallToActionSection />
        <NAUFormSection
          projectId={project.id}
          webhookUrl={project.webhook_url}
          submitted={isThankYouPage}
        />
      </main>
      <NAUFooter />
      <NAUFloatingCTA />
    </div>
  );
};

export default NAULandingPage;
