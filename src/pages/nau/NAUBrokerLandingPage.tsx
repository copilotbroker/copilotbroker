import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  NAUHeader,
  NAUHeroSection,
  NAUAboutSection,
  NAUFeaturesSection,
  NAUConditionsSection,
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

interface Broker {
  id: string;
  name: string;
  slug: string;
}

const NAUBrokerLandingPage = () => {
  const { brokerSlug } = useParams<{ brokerSlug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  usePageTracking(project?.id);

  useEffect(() => {
    const fetchData = async () => {
      if (!brokerSlug) {
        navigate("/osorio/nau");
        return;
      }
      try {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, name, slug, webhook_url")
          .eq("city_slug", "osorio")
          .eq("slug", "nau")
          .eq("is_active", true)
          .maybeSingle();

        if (projectError || !projectData) {
          navigate("/");
          return;
        }

        const { data: brokerData, error: brokerError } = await supabase
          .from("brokers")
          .select("id, name, slug")
          .eq("slug", brokerSlug)
          .eq("is_active", true)
          .maybeSingle();

        if (brokerError || !brokerData) {
          navigate("/osorio/nau");
          return;
        }

        const { data: association, error: assocError } = await supabase
          .from("broker_projects")
          .select("id")
          .eq("broker_id", brokerData.id)
          .eq("project_id", projectData.id)
          .eq("is_active", true)
          .maybeSingle();

        if (assocError || !association) {
          navigate("/osorio/nau");
          return;
        }

        setProject(projectData);
        setBroker(brokerData);
      } catch (err) {
        console.error("Error:", err);
        navigate("/osorio/nau");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [brokerSlug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,35%,8%)]">
        <RefreshCw className="w-8 h-8 text-[hsl(200,60%,40%)] animate-spin" />
      </div>
    );
  }

  if (!project || !broker) return null;

  const canonicalUrl = `https://onovocondominio.com.br/osorio/nau/${broker.slug}`;

  return (
    <div className="min-h-screen bg-[hsl(210,35%,8%)] text-white pb-14 sm:pb-0">
      <Helmet>
        <title>NAU | {broker.name} - Condomínio Náutico em Osório</title>
        <meta name="description" content={`Condomínio náutico em Osório com acesso à Lagoa do Peixoto. Atendimento personalizado com ${broker.name}. Lotes a partir de R$ 229 mil.`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`NAU | ${broker.name}`} />
        <meta property="og:description" content={`Condomínio náutico em Osório. Atendimento com ${broker.name}.`} />
        <meta property="og:locale" content="pt_BR" />
      </Helmet>

      <a href="#cadastro" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[hsl(200,60%,40%)] focus:text-white focus:rounded">
        Ir para o cadastro
      </a>

      <NAUHeader />
      <main>
        <NAUHeroSection />
        <NAUAboutSection />
        <NAUFeaturesSection />
        <NAUConditionsSection />
        <NAUTargetSection />
        <NAUUrgencySection />
        <NAUBenefitsSection />
        <NAUCallToActionSection />
        <NAUFormSection
          projectId={project.id}
          brokerId={broker.id}
          brokerSlug={broker.slug}
          webhookUrl={project.webhook_url}
        />
      </main>
      <NAUFooter />
      <NAUFloatingCTA />
    </div>
  );
};

export default NAUBrokerLandingPage;
