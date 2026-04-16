import { useEffect, useState } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";
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

const AuraLeganoBrokerLandingPage = () => {
  const { brokerSlug } = useParams<{ brokerSlug: string }>();
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [brokerId, setBrokerId] = useState<string | undefined>(undefined);
  const [brokerName, setBrokerName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageTracking(projectId);

  useEffect(() => {
    const fetchData = async () => {
      if (!brokerSlug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "auralegano")
        .eq("city_slug", "novasantarita")
        .single();
      if (project) setProjectId(project.id);

      const { data: broker } = await supabase
        .from("brokers")
        .select("id, name")
        .eq("slug", brokerSlug)
        .eq("is_active", true)
        .single();

      if (!broker) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setBrokerId(broker.id);
      setBrokerName(broker.name);
      setIsLoading(false);
    };
    fetchData();
  }, [brokerSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/novasantarita/auralegano" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Aura Legano | {brokerName} - Últimos 15 Lotes em Nova Santa Rita</title>
        <meta name="description" content={`Aura Legano em Nova Santa Rita. Atendimento exclusivo com ${brokerName}. Condomínio fechado de alto padrão com clube completo.`} />
        <meta property="og:title" content={`Aura Legano | ${brokerName}`} />
        <meta property="og:description" content="Restam apenas 15 lotes. Entrega Julho/2026." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <ALHeader brokerName={brokerName} />
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
        <ALFormSection projectId={projectId} brokerId={brokerId} submitted={submitted} />
        <ALFloatingCTA />
        <ALFooter />
      </div>
    </>
  );
};

export default AuraLeganoBrokerLandingPage;
