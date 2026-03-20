import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
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
  MonacoFormSection,
  MonacoFooter,
  MonacoFloatingCTA,
} from "@/components/monaco";

interface Project {
  id: string;
  name: string;
  slug: string;
  webhook_url: string | null;
}

const MonacoLandingPage = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isThankYouPage = location.pathname === "/xangrila/monaco/obrigado";

  usePageTracking(project?.id);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, slug, webhook_url")
          .eq("city_slug", "xangrila")
          .eq("slug", "monaco")
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Error fetching project:", error);
          navigate("/");
          return;
        }
        if (!data) {
          console.error("Monaco project not found");
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
      <div className="min-h-screen flex items-center justify-center bg-[hsl(215,45%,8%)]">
        <RefreshCw className="w-8 h-8 text-[hsl(35,35%,50%)] animate-spin" />
      </div>
    );
  }

  if (!project) return null;

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

  return (
    <div className="min-h-screen bg-[hsl(215,45%,8%)] text-white">
      <Helmet>
        <title>Mônaco Grand Marina | Condomínio Náutico em Xangri-lá</title>
        <meta name="title" content="Mônaco Grand Marina | Condomínio Náutico de Alto Padrão" />
        <meta name="description" content="Condomínio náutico de alto padrão na Lagoa dos Quadros, Xangri-lá. 367 lotes com canais navegáveis, marina, clube social e Parque da Orla. Cadastre-se." />
        <meta name="keywords" content="Mônaco Grand Marina, condomínio náutico Xangri-lá, lotes Lagoa dos Quadros, condomínio alto padrão litoral RS, marina club Xangri-lá" />
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
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[hsl(35,35%,50%)] focus:text-white focus:rounded"
      >
        Ir para o cadastro
      </a>

      <MonacoHeader />
      <main id="main-content" role="main">
        <MonacoHeroSection />
        <MonacoAboutSection />
        <MonacoNauticoSection />
        <MonacoClubSection />
        <MonacoParqueSection />
        <MonacoLocationSection />
        <MonacoTargetSection />
        <MonacoFormSection
          projectId={project.id}
          webhookUrl={project.webhook_url}
          submitted={isThankYouPage}
        />
      </main>
      <MonacoFooter />
      <MonacoFloatingCTA />
    </div>
  );
};

export default MonacoLandingPage;
