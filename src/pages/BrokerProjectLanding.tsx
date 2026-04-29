import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";
import ProjectBrokerLandingPage from "@/pages/ProjectBrokerLandingPage";
import FormSection from "@/components/FormSection";
import FloatingCTA from "@/components/FloatingCTA";
import { RefreshCw } from "lucide-react";
import { usePageTracking } from "@/hooks/use-page-tracking";

interface BrokerOwner {
  id: string;
  slug: string;
  name: string;
}

const BrokerProjectLanding = () => {
  const { brokerSlug, citySlug, projectSlug } = useParams<{ brokerSlug?: string; citySlug: string; projectSlug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [brokerOwner, setBrokerOwner] = useState<BrokerOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderLegacy, setRenderLegacy] = useState(false);

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
          // Not a broker-owned project. This URL pattern (/:a/:b/:c) might be a
          // legacy city/project/brokerSlug URL — re-interpret accordingly.
          if (brokerSlug && citySlug && projectSlug) {
            const legacyCity = brokerSlug;
            const legacyProject = citySlug;
            const legacyBroker = projectSlug;
            const { data: legacy } = await supabase
              .from("projects")
              .select("id")
              .eq("city_slug", legacyCity)
              .eq("slug", legacyProject)
              .eq("is_active", true)
              .maybeSingle();
            if (legacy) {
              // Render legacy city/project/broker landing inline (avoid route loop).
              setRenderLegacy(true);
              setIsLoading(false);
              return;
            }
          }
          navigate("/");
          return;
        }

        const typedProject = data as unknown as Project;

        if (typedProject.created_by_broker_id) {
          const { data: owner, error: ownerError } = await supabase
            .from("brokers")
            .select("id, slug, name")
            .eq("id", typedProject.created_by_broker_id)
            .eq("is_active", true)
            .maybeSingle();

          if (ownerError) throw ownerError;
          if (!owner) {
            navigate("/");
            return;
          }

          if (brokerSlug && owner.slug !== brokerSlug) {
            navigate(`/${owner.slug}/${citySlug}/${projectSlug}`, { replace: true });
            return;
          }

          setBrokerOwner(owner);
        }

        setProject(typedProject);
      } catch (error) {
        console.error("Erro ao buscar projeto:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [brokerSlug, citySlug, projectSlug, navigate]);

  useEffect(() => {
    if (project) {
      document.title = `${project.name} | ${brokerOwner?.name || project.city}`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          project.description ||
            `${project.name} em ${project.city}. Conheça este imóvel exclusivo.`
        );
      }
    }
  }, [project, brokerOwner]);

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

  // Legacy URL format /:citySlug/:projectSlug/:brokerSlug — render the legacy
  // page component with remapped params (the broker-first route reuses the
  // same path so we have to re-alias them explicitly here).
  if (renderLegacy) {
    return (
      <ProjectBrokerLandingPage
        citySlugOverride={brokerSlug}
        projectSlugOverride={citySlug}
        brokerSlugOverride={projectSlug}
      />
    );
  }

  if (!project) return null;

  if (project.landing_content) {
    return (
      <DynamicLandingPage
        project={project}
        brokerId={brokerOwner?.id || project.created_by_broker_id}
        brokerSlug={brokerOwner?.slug || brokerSlug || undefined}
      />
    );
  }

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
          brokerId={brokerOwner?.id || project.created_by_broker_id || undefined}
          brokerSlug={brokerOwner?.slug || brokerSlug || undefined}
          allowBrokerSelection={false}
          webhookUrl={project.webhook_url}
        />
      </main>
      <FloatingCTA />
    </div>
  );
};

export default BrokerProjectLanding;
