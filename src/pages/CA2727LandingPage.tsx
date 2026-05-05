import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  CA2727HeroSection,
  CA2727AboutSection,
  CA2727FeaturesSection,
  CA2727LifestyleSection,
  CA2727CTASection,
  CA2727FormSection,
  CA2727Footer,
  CA2727FloatingCTA,
} from "@/components/ca2727";

const CA2727LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { brokerSlug } = useParams<{ brokerSlug?: string }>();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [brokerId, setBrokerId] = useState<string | undefined>(undefined);

  usePageTracking(projectId);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "ca2727")
        .eq("city_slug", "estanciavelha")
        .single();

      if (data) {
        setProjectId(data.id);
      }
    };

    fetchProject();
  }, []);

  useEffect(() => {
    const fetchBroker = async () => {
      if (!brokerSlug) {
        setBrokerId(undefined);
        return;
      }
      const { data } = await supabase
        .from("brokers")
        .select("id")
        .eq("slug", brokerSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setBrokerId(data.id);
      } else {
        // broker slug inválido — volta para landing principal
        const base = location.pathname.replace(/\/obrigado$/, "").split("/").slice(0, -1).join("/");
        navigate(base || "/", { replace: true });
      }
    };
    fetchBroker();
  }, [brokerSlug, location.pathname, navigate]);

  const canonicalUrl = "https://onovocondominio.com.br/estanciavelha/ca2727";

  const residenceSchema = {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    "@id": `${canonicalUrl}#residence`,
    name: "Casa Horizon Clube Residencial CA2727",
    description: "Casa espetacular de 372m² no Condomínio Horizon Clube Residencial em Estância Velha. 3 suítes, piscina, energia solar e automação completa.",
    url: canonicalUrl,
    floorSize: { "@type": "QuantitativeValue", value: 372, unitCode: "MTK" },
    numberOfRooms: 3,
    numberOfBathroomsTotal: 5,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Estância Velha",
      addressRegion: "RS",
      addressCountry: "BR",
      streetAddress: "Encosta do Sol",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Piscina", value: true },
      { "@type": "LocationFeatureSpecification", name: "Energia Solar", value: true },
      { "@type": "LocationFeatureSpecification", name: "Automação", value: true },
      { "@type": "LocationFeatureSpecification", name: "Lareira", value: true },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Casa Horizon Clube Residencial | Estância Velha — 372m², 3 Suítes</title>
        <meta name="title" content="Casa Horizon Clube Residencial | Alto Padrão em Estância Velha" />
        <meta name="description" content="Casa espetacular de 372m² no Condomínio Horizon Clube Residencial. 3 suítes, piscina, energia solar, automação e vista para o pôr do sol." />
        <meta name="keywords" content="casa alto padrão Estância Velha, Horizon Clube Residencial, casa com piscina RS, casa condomínio fechado" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Enove Imobiliária" />
        <meta property="og:title" content="Casa Horizon Clube Residencial | Estância Velha" />
        <meta property="og:description" content="Casa espetacular de 372m² no Condomínio Horizon. 3 suítes, piscina e energia solar." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:image" content="https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Casa Horizon Clube Residencial | Estância Velha" />
        <meta name="twitter:description" content="Casa espetacular de 372m² no Condomínio Horizon." />
        <meta name="twitter:image" content="https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg" />
        <script type="application/ld+json">{JSON.stringify(residenceSchema)}</script>
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o cadastro
      </a>

      <div className="ca2727-theme min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <main id="main-content" role="main">
          <CA2727HeroSection />
          <CA2727AboutSection />
          <CA2727FeaturesSection />
          <CA2727LifestyleSection />
          <CA2727CTASection />
          <CA2727FormSection projectId={projectId} submitted={submitted} />
        </main>
        <CA2727FloatingCTA />
        <CA2727Footer />
      </div>
    </>
  );
};

export default CA2727LandingPage;
