import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import VivaParkLandingPage from "./VivaParkLandingPage";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Broker {
  id: string;
  name: string;
  slug: string;
}

const VivaParkBrokerLandingPage = () => {
  const { brokerSlug } = useParams<{ brokerSlug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  usePageTracking(project?.id);

  useEffect(() => {
    const fetchData = async () => {
      if (!brokerSlug) {
        navigate("/portobelo/vivapark");
        return;
      }
      try {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, name, slug")
          .eq("city_slug", "portobelo")
          .eq("slug", "vivapark")
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
          navigate("/portobelo/vivapark");
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
          navigate("/portobelo/vivapark");
          return;
        }

        setProject(projectData);
        setBroker(brokerData);
      } catch (err) {
        console.error("Error:", err);
        navigate("/portobelo/vivapark");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [brokerSlug, navigate]);

  if (isLoading) {
    return (
      <div className="vivapark-theme min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!project || !broker) return null;

  return <VivaParkLandingPage brokerId={broker.id} brokerName={broker.name} />;
};

export default VivaParkBrokerLandingPage;
