import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  CA2589HeroSection,
  CA2589AboutSection,
  CA2589FeaturesSection,
  CA2589LifestyleSection,
  CA2589CTASection,
  CA2589FormSection,
  CA2589Footer,
  CA2589FloatingCTA,
} from "@/components/ca2589";

const CA2589LandingPage = () => {
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
        .eq("slug", "ca2589")
        .eq("city_slug", "estanciavelha")
        .single();
      if (data) setProjectId(data.id);
    };
    fetchProject();
  }, []);

  useEffect(() => {
    const fetchBroker = async () => {
      if (!brokerSlug) { setBrokerId(undefined); return; }
      const { data } = await supabase
        .from("brokers")
        .select("id")
        .eq("slug", brokerSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setBrokerId(data.id);
      } else {
        const base = location.pathname.replace(/\/obrigado$/, "").split("/").slice(0, -1).join("/");
        navigate(base || "/", { replace: true });
      }
    };
    fetchBroker();
  }, [brokerSlug, location.pathname, navigate]);

  const canonicalUrl = "https://onovocondominio.com.br/estanciavelha/ca2589";

  const residenceSchema = {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    "@id": `${canonicalUrl}#residence`,
    name: "Casa Horizon Clube Residencial CA2589",
    description: "Casa de 323m² no Condomínio Horizon Clube Residencial em Estância Velha. 4 suítes, piscina aquecida, energia solar e vista para o pôr do sol.",
    url: canonicalUrl,
    floorSize: { "@type": "QuantitativeValue", value: 323, unitCode: "MTK" },
    numberOfRooms: 4,
    numberOfBathroomsTotal: 5,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Estância Velha",
      addressRegion: "RS",
      addressCountry: "BR",
      streetAddress: "Encosta do Sol",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Piscina Aquecida", value: true },
      { "@type": "LocationFeatureSpecification", name: "Energia Solar", value: true },
      { "@type": "LocationFeatureSpecification", name: "Lareira", value: true },
      { "@type": "LocationFeatureSpecification", name: "Home Office", value: true },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Casa Horizon Clube Residencial CA2589 | Estância Velha — 323m², 4 Suítes</title>
        <meta name="description" content="Casa de 323m² no Condomínio Horizon Clube Residencial. 4 suítes, piscina aquecida, energia solar e vista para o pôr do sol." />
        <meta name="keywords" content="casa alto padrão Estância Velha, Horizon Clube Residencial, casa com piscina RS, casa condomínio fechado" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Enove Imobiliária" />
        <meta property="og:title" content="Casa Horizon Clube Residencial CA2589 | Estância Velha" />
        <meta property="og:description" content="Casa de 323m² no Horizon. 4 suítes, piscina aquecida e energia solar." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:image" content="https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://flip-prod-fotos.s3.amazonaws.com/dddaa801-5f1c-4920-b343-6c22e23f0baa.jpeg" />
        <script type="application/ld+json">{JSON.stringify(residenceSchema)}</script>

        {/* Meta Pixel - Enove Imobiliária / Horizon */}
        <script>{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '27492837196985855');
          fbq('track', 'PageView');
        `}</script>
      </Helmet>

      <a href="#cadastro" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        Pular para o cadastro
      </a>

      <div className="ca2589-theme min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <main id="main-content" role="main">
          <CA2589HeroSection />
          <CA2589AboutSection />
          <CA2589FeaturesSection />
          <CA2589LifestyleSection />
          <CA2589CTASection />
          <CA2589FormSection projectId={projectId} brokerId={brokerId} submitted={submitted} allowBrokerSelection={!brokerId} />
        </main>
        <CA2589FloatingCTA />
        <CA2589Footer />
      </div>
    </>
  );
};

export default CA2589LandingPage;
