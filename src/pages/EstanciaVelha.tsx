import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
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
import { usePageTracking } from "@/hooks/use-page-tracking";
import { supabase } from "@/integrations/supabase/client";

const EstanciaVelha = () => {
  const [projectId, setProjectId] = useState<string | null>(null);

  // Fetch project ID for estanciavelha
  useEffect(() => {
    const fetchProjectId = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "estanciavelha")
        .maybeSingle();
      
      if (data) {
        setProjectId((data as any).id);
      }
    };
    fetchProjectId();
  }, []);

  // Track page view with project ID
  usePageTracking(projectId || undefined);

  const canonicalUrl = "https://onovocondominio.com.br/estanciavelha";
  const ogImageUrl = "https://onovocondominio.com.br/og-image.jpg";

  // Service Schema (more appropriate for a landing page about upcoming launches)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    "name": "Acesso Antecipado a Lançamentos Imobiliários em Estância Velha",
    "description": "Cadastre-se para receber informações em primeira mão sobre lançamentos imobiliários de alto padrão em Estância Velha. Condições exclusivas de pré-lançamento e atendimento prioritário.",
    "url": canonicalUrl,
    "image": ogImageUrl,
    "provider": {
      "@type": "RealEstateAgent",
      "name": "Enove Imobiliária",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Estância Velha",
        "addressRegion": "RS",
        "addressCountry": "BR"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Estância Velha",
      "containedInPlace": {
        "@type": "State",
        "name": "Rio Grande do Sul"
      }
    }
  };

  // FAQ Schema for Rich Snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O que é o acesso antecipado a lançamentos imobiliários?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O acesso antecipado permite que você receba informações exclusivas sobre novos empreendimentos em Estância Velha antes da divulgação oficial ao mercado, garantindo prioridade na escolha das melhores unidades e condições especiais de pré-lançamento."
        }
      },
      {
        "@type": "Question",
        "name": "Por que investir em lançamentos em Estância Velha?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Estância Velha combina natureza preservada, infraestrutura em crescimento e localização estratégica no Vale dos Sinos, tornando-se um dos destinos mais desejados para empreendimentos de alto padrão com alto potencial de valorização."
        }
      },
      {
        "@type": "Question",
        "name": "O cadastro tem algum custo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Não, o cadastro é totalmente gratuito e sem compromisso. Você receberá informações prioritárias sobre lançamentos selecionados e poderá escolher se deseja prosseguir com algum deles."
        }
      },
      {
        "@type": "Question",
        "name": "Quais vantagens tenho ao me cadastrar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Condições exclusivas de lançamento, atendimento prioritário com especialistas Enove, acesso a empreendimentos selecionados com alto potencial de valorização e informações antes do mercado aberto."
        }
      }
    ]
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://onovocondominio.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Estância Velha", "item": canonicalUrl }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Lançamentos Imobiliários Estância Velha | Acesso Antecipado Exclusivo</title>
        <meta name="title" content="Lançamentos Imobiliários Estância Velha | Acesso Antecipado Exclusivo" />
        <meta name="description" content="Cadastre-se para acesso antecipado aos próximos lançamentos imobiliários de Estância Velha. Empreendimentos de alto padrão, condições exclusivas de pré-lançamento e atendimento prioritário Enove." />
        <meta name="keywords" content="lançamentos imobiliários Estância Velha, pré-lançamento terrenos RS, empreendimentos alto padrão Vale dos Sinos, Enove Imobiliária, acesso antecipado imóveis, condomínios Estância Velha, investimento imobiliário RS" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Enove Imobiliária" />
        <meta property="og:title" content="Lançamentos Imobiliários Estância Velha | Acesso Antecipado Exclusivo" />
        <meta property="og:description" content="Cadastre-se para acesso antecipado aos próximos lançamentos imobiliários de Estância Velha. Empreendimentos de alto padrão e condições exclusivas de pré-lançamento." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Lançamentos imobiliários exclusivos em Estância Velha" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content="Lançamentos Imobiliários Estância Velha | Acesso Antecipado Exclusivo" />
        <meta name="twitter:description" content="Cadastre-se para acesso antecipado aos próximos lançamentos imobiliários de Estância Velha. Empreendimentos de alto padrão e condições exclusivas." />
        <meta name="twitter:image" content={ogImageUrl} />

        {/* JSON-LD Schemas */}
        <script type="application/ld+json">
          {JSON.stringify(serviceSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>

        {/* Microsoft Clarity - Estância Velha */}
        <script type="text/javascript">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "vbso39eiiq");`}
        </script>
      </Helmet>

      {/* Skip to main content - Accessibility */}
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
            projectId={projectId}
            projectSlug="estanciavelha"
            allowBrokerSelection={true} 
          />
          <DisclaimerSection />
        </main>
        <Footer />
        <FloatingCTA />
      </div>
    </>
  );
};

export default EstanciaVelha;
