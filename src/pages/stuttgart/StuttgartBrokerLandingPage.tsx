import { useEffect, useState } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";
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
  STTargetSection,
  STUrgencySection,
  STBenefitsSection,
  STCallToActionSection,
  STFormSection,
  STFloatingCTA,
  STFooter,
} from "@/components/stuttgart";

const StuttgartBrokerLandingPage = () => {
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
        .eq("slug", "stuttgart")
        .eq("city_slug", "ivoti")
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
  // Microsoft Clarity — carregado IMEDIATAMENTE
  useEffect(() => {
    if (typeof window === "undefined" || (window as any).clarity) return;
    (function (c: any, l: Document, a: string, r: string, i: string) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = 1 as any;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", "wfrjoqhzwc");
  }, []);

  // Meta Pixel — carregado IMEDIATAMENTE no head

  useEffect(() => {
    if (submitted && typeof window !== "undefined" && (window as any).fbq) {
      ((window as any).fbq as Function)("track", "PageView");
    }
  }, [submitted]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/ivoti/stuttgart" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Jardins de Stuttgart | {brokerName} - Condomínio Clube em Ivoti</title>
        <meta name="description" content={`Residencial Jardins de Stuttgart em Ivoti. Atendimento exclusivo com ${brokerName}. Condomínio clube completo.`} />
        <meta property="og:title" content={`Jardins de Stuttgart | ${brokerName}`} />
        <meta property="og:description" content="Você não precisa mais sair de casa para viver bem." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="robots" content="noindex, nofollow" />
        <script type="text/javascript">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wfrjoqhzwc");`}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <STHeader brokerName={brokerName} />
        <STHeroSection />
        <STAboutSection />
        <STClubSection />
        <STIntelligenceSection />
        <STPlantsSection />
        <STTargetSection />
        <STUrgencySection />
        <STBenefitsSection />
        <STCallToActionSection />
        <STFormSection projectId={projectId} brokerId={brokerId} submitted={submitted} />
        <STFloatingCTA />
        <STFooter />
      </div>
    </>
  );
};

export default StuttgartBrokerLandingPage;
