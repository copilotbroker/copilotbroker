import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";
import FormSection from "@/components/FormSection";
import FloatingCTA from "@/components/FloatingCTA";
import { RefreshCw } from "lucide-react";
import { usePageTracking } from "@/hooks/use-page-tracking";

const BrokerProjectLanding = () => {
  const { citySlug, projectSlug } = useParams<{ citySlug: string; projectSlug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  usePageTracking(project?.id);

  useEffect(() => {
    const fetchProject = async () => {
      if (!citySlug || !projectSlug) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("city_slug", citySlug)
          .eq("slug", projectSlug)
          .not("created_by_broker_id", "is", null)
          .eq("is_active", true)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          navigate("/");
          return;
        }

        setProject(data as unknown as Project);
      } catch (error) {
        console.error("Erro ao buscar projeto:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [citySlug, projectSlug, navigate]);

  useEffect(() => {
    if (project) {
      document.title = `${project.name} | ${project.city}`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          project.description ||
            `${project.name} em ${project.city}. Conheça este imóvel exclusivo.`
        );
      }
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  if (project.landing_content) {
    return <DynamicLandingPage project={project} />;
  }

  // Fallback minimal for broker projects without landing_content
  return (
    <div className="min-h-screen bg-background">
      <main>
        <div className="max-w-3xl mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{project.name}</h1>
          <p className="text-muted-foreground mb-8">{project.city}</p>
          {project.description && <p className="text-muted-foreground mb-8">{project.description}</p>}
        </div>
        <FormSection
          projectId={project.id}
          projectSlug={project.slug}
          brokerId={project.created_by_broker_id || undefined}
          webhookUrl={project.webhook_url}
        />
      </main>
      <FloatingCTA />
    </div>
  );
};

export default BrokerProjectLanding;
