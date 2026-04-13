import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { usePageTracking } from "@/hooks/use-page-tracking";
import {
  MonacoHeroSection,
  MonacoAboutSection,
  MonacoNauticoSection,
  MonacoClubSection,
  MonacoParqueSection,
  MonacoLocationSection,
  MonacoTargetSection,
  MonacoCTASection,
  MonacoFormSection,
  MonacoFooter,
  MonacoFloatingCTA,
} from "@/components/monaco";

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

const MonacoBrokerLandingPage = () => {
  const { brokerSlug } = useParams<{ brokerSlug: string }>();
  const location = useLocation();
  const submitted = location.pathname.endsWith("/obrigado");
  const [project, setProject] = useState<Project | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  usePageTracking(project?.id);

  useEffect(() => {
    const fetchData = async () => {
      if (!brokerSlug) {
        navigate("/xangrila/monaco");
        return;
      }
      try {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, name, slug, webhook_url")
          .eq("city_slug", "xangrila")
          .eq("slug", "monaco")
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
          navigate("/xangrila/monaco");
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
          navigate("/xangrila/monaco");
          return;
        }

        setProject(projectData);
        setBroker(brokerData);
      } catch (err) {
        console.error("Error:", err);
        navigate("/xangrila/monaco");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [brokerSlug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!project || !broker) return null;

  const canonicalUrl = `https://onovocondominio.com.br/xangrila/monaco/${broker.slug}`;

  return (
    <>
      <Helmet>
        <title>Mônaco Grand Marina | {broker.name}</title>
        <meta name="description" content={`Condomínio náutico de alto padrão na Lagoa dos Quadros, Xangri-lá. Atendimento personalizado com ${broker.name}.`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Mônaco Grand Marina | ${broker.name}`} />
        <meta property="og:description" content={`Condomínio náutico em Xangri-lá. Atendimento com ${broker.name}.`} />
        <meta property="og:locale" content="pt_BR" />
        <script>{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '4261464794069997');
          fbq('track', 'PageView');
        `}</script>
      </Helmet>

      <a
        href="#cadastro"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o cadastro
      </a>

      <div className="monaco-theme min-h-screen bg-background text-foreground pb-14 sm:pb-0">
        <main id="main-content" role="main">
          <MonacoHeroSection />
          <MonacoAboutSection />
          <MonacoNauticoSection />
          <MonacoClubSection />
          <MonacoParqueSection />
          <MonacoLocationSection />
          <MonacoTargetSection />
          <MonacoCTASection />
          <MonacoFormSection
            projectId={project.id}
            brokerId={broker.id}
            submitted={submitted}
            allowBrokerSelection={false}
          />
        </main>
        <MonacoFloatingCTA />
        <MonacoFooter />
      </div>
    </>
  );
};

export default MonacoBrokerLandingPage;
