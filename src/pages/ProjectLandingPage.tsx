import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project, LandingContent } from "@/types/project";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturesSection from "@/components/FeaturesSection";
import UrgencySection from "@/components/UrgencySection";
import BenefitsSection from "@/components/BenefitsSection";
import FormSection from "@/components/FormSection";
import DisclaimerSection from "@/components/DisclaimerSection";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";
import { RefreshCw } from "lucide-react";
import { usePageTracking } from "@/hooks/use-page-tracking";

const ProjectLandingPage = () => {
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
            `Pré-lançamento exclusivo: ${project.name} em ${project.city}. Cadastre-se para acesso antecipado.`
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

  if (!project) {
    return null;
  }

  // If project has AI-generated landing content, render dynamic version
  if (project.landing_content) {
    return <DynamicLandingPage project={project} />;
  }

  // Projects created by a broker but without AI-generated content yet:
  // show a friendly placeholder instead of the generic legacy layout
  // (which used to render Bairro das Rosas hero/about and confused users).
  if (project.created_by_broker_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground">
            Esta landing page ainda está sendo preparada. Volte em instantes.
          </p>
        </div>
      </div>
    );
  }

  // Legacy fallback for old non-broker projects (Bairro das Rosas, etc.)
  return (
    <>
      <a
        href="#sobre"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o conteúdo principal
      </a>

      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" role="main">
          <HeroSection />
          <AboutSection />
          <FeaturesSection />
          <UrgencySection />
          <BenefitsSection />
          <FormSection
            projectId={project.id}
            projectSlug={project.slug}
            allowBrokerSelection={true}
            webhookUrl={project.webhook_url}
          />
          <DisclaimerSection />
        </main>
        <Footer />
        <FloatingCTA />
      </div>
    </>
  );
};

export default ProjectLandingPage;
