import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ASRamosLandingPage from "./ASRamosLandingPage";
import { RefreshCw } from "lucide-react";

const ASRamosBrokerLandingPage = () => {
  const { brokerSlug } = useParams<{ brokerSlug: string }>();
  const navigate = useNavigate();
  const [broker, setBroker] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBroker = async () => {
      if (!brokerSlug) { navigate("/portobelo/asramos"); return; }
      try {
        const { data: brokerData } = await supabase
          .from("brokers").select("id, name").eq("slug", brokerSlug).eq("is_active", true).maybeSingle();
        if (!brokerData) { navigate("/portobelo/asramos"); return; }

        const { data: projectData } = await supabase
          .from("projects").select("id").eq("slug", "asramos-vivapark").maybeSingle();
        if (projectData) {
          const { data: link } = await supabase
            .from("broker_projects").select("id")
            .eq("broker_id", brokerData.id).eq("project_id", (projectData as any).id)
            .eq("is_active", true).maybeSingle();
          if (!link) { navigate("/portobelo/asramos"); return; }
        }

        setBroker(brokerData);
      } catch { navigate("/portobelo/asramos"); } finally { setIsLoading(false); }
    };
    fetchBroker();
  }, [brokerSlug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!broker) return null;

  return <ASRamosLandingPage brokerId={broker.id} brokerName={broker.name} />;
};

export default ASRamosBrokerLandingPage;
