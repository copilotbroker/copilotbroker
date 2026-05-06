import { Helmet } from "react-helmet-async";
import { MessageCircle } from "lucide-react";
import logoEnove from "@/assets/logo-enove.png";
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

const WHATSAPP_URL =
  "https://wa.me/5551997010323?text=Quero%20saber%20mais%20sobre%20o%20Copilot%20Broker";

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
        {/* Sticky Header with persistent CTA */}
        <header
          className="sticky top-0 z-40 py-3 px-4 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#1e1e22]"
          role="banner"
        >
          <nav
            className="container flex items-center justify-between"
            aria-label="Navegação principal"
          >
            <a
              href="/"
              className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              aria-label="Copilot Broker"
            >
              <img
                src={logoEnove}
                alt="Copilot Broker"
                className="h-9 sm:h-10 w-auto"
                width="120"
                height="40"
                loading="eager"
              />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:scale-[1.03] transition-all shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">FALAR NO WHATSAPP</span>
              <span className="sm:hidden">WHATSAPP</span>
            </a>
          </nav>
        </header>

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
