import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";
import {
  HomeHero,
  HomePositioning,
  HomeDifferentials,
  HomeProcess,
  HomePartnership,
  HomePlatform,
  HomeCTA,
} from "@/components/home";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Copilot Broker | CRM com IA no WhatsApp para Imobiliárias</title>
        <meta
          name="description"
          content="Pare de perder leads no WhatsApp. O Copilot Broker é o CRM com IA que atende, qualifica e distribui leads automaticamente para imobiliárias e corretores do RS."
        />
        <meta property="og:title" content="Copilot Broker | CRM com IA no WhatsApp para Imobiliárias" />
        <meta
          property="og:description"
          content="Atendimento automatizado 24/7, roleta de leads, cadência anti-perda e dashboard ao vivo. Teste 7 dias grátis."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://copilotbroker.com.br/" />
        <link rel="canonical" href="https://copilotbroker.com.br/" />
      </Helmet>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o conteúdo principal
      </a>

      <div className="min-h-screen bg-[#0a0a0f] flex flex-col dark">

        <main id="main-content" className="flex-1" role="main">
          <HomeHero />
          <HomePositioning />
          <HomeDifferentials />
          <HomeProcess />
          <HomePartnership />
          <HomePlatform />
          <HomeCTA />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Home;
