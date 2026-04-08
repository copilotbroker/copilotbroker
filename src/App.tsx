import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import AppHead from "@/components/AppHead";
import Home from "./pages/Home";
// Backup: landing pages completas de Estância Velha (reativar trocando as rotas abaixo)
import EstanciaVelha from "./pages/EstanciaVelha";
// import BrokerLandingPage from "./pages/BrokerLandingPage";
import EstanciaVelhaTeaser from "./pages/EstanciaVelhaTeaser";
import BairrodasRosas from "./pages/BairrodasRosas";
import EstanciaVelhaBrokerTeaser from "./pages/EstanciaVelhaBrokerTeaser";
import ProjectLandingPage from "./pages/ProjectLandingPage";
import ProjectBrokerLandingPage from "./pages/ProjectBrokerLandingPage";
import GoldenViewLandingPage from "./pages/goldenview/GoldenViewLandingPage";
import GoldenViewBrokerLandingPage from "./pages/goldenview/GoldenViewBrokerLandingPage";
import MauricioCardosoLandingPage from "./pages/mauriciocardoso/MauricioCardosoLandingPage";
import MauricioCardosoBrokerLandingPage from "./pages/mauriciocardoso/MauricioCardosoBrokerLandingPage";
import TermosGoldenView from "./pages/goldenview/TermosGoldenView";
import TermosMauricioCardoso from "./pages/mauriciocardoso/TermosMauricioCardoso";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import DesignSystem from "./pages/DesignSystem";

import BrokerAdmin from "./pages/BrokerAdmin";
import BrokerProjects from "./pages/BrokerProjects";
import BrokerSignup from "./pages/BrokerSignup";

import BrokerRoletasPage from "./pages/BrokerRoletasPage";
import BrokerProjectLanding from "./pages/BrokerProjectLanding";
import BrokerInbox from "./pages/BrokerInbox";
import BrokerPlantao from "./pages/BrokerPlantao";
import BrokerCopilotConfig from "./pages/BrokerCopilotConfig";
import AdminInbox from "./pages/AdminInbox";
import AdminPlantao from "./pages/AdminPlantao";
import AdminCopilotConfig from "./pages/AdminCopilotConfig";
import AdminAgenda from "./pages/AdminAgenda";
import BrokerAgenda from "./pages/BrokerAgenda";
import BrokerProfile from "./pages/BrokerProfile";
import Prontos from "./pages/Prontos";
import ProntosBrokerPage from "./pages/ProntosBrokerPage";
import Termos from "./pages/Termos";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LeadPage from "./pages/LeadPage";
import CaminhadaEV from "./pages/CaminhadaEV";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import NotFound from "./pages/NotFound";
import NAULandingPage from "./pages/nau/NAULandingPage";
import NAUBrokerLandingPage from "./pages/nau/NAUBrokerLandingPage";
import TermosNAU from "./pages/nau/TermosNAU";
import MonacoLandingPage from "./pages/monaco/MonacoLandingPage";
import TermosMonaco from "./pages/monaco/TermosMonaco";
import VivaParkLandingPage from "./pages/vivapark/VivaParkLandingPage";
import VivaParkBrokerLandingPage from "./pages/vivapark/VivaParkBrokerLandingPage";
import TermosVivaPark from "./pages/vivapark/TermosVivaPark";
import NC1LandingPage from "./pages/vivapark/NC1LandingPage";
import NC1BrokerLandingPage from "./pages/vivapark/NC1BrokerLandingPage";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppHead />
            <Routes>
            <Route path="/" element={<Home />} />
            
            {/* GoldenView - custom landing page with unique visual identity */}
            <Route path="/portao/goldenview" element={<GoldenViewLandingPage />} />
            <Route path="/portao/goldenview/obrigado" element={<GoldenViewLandingPage />} />
            <Route path="/portao/goldenview/termos" element={<TermosGoldenView />} />
            <Route path="/portao/goldenview/:brokerSlug" element={<GoldenViewBrokerLandingPage />} />
            
            {/* Mauricio Cardoso - Wellness landing page for Novo Hamburgo */}
            <Route path="/novohamburgo/mauriciocardoso" element={<MauricioCardosoLandingPage />} />
            <Route path="/novohamburgo/mauriciocardoso/obrigado" element={<MauricioCardosoLandingPage />} />
            <Route path="/novohamburgo/mauriciocardoso/termos" element={<TermosMauricioCardoso />} />
            <Route path="/novohamburgo/mauriciocardoso/:brokerSlug/obrigado" element={<MauricioCardosoBrokerLandingPage />} />
            <Route path="/novohamburgo/mauriciocardoso/:brokerSlug" element={<MauricioCardosoBrokerLandingPage />} />
            
            {/* Legacy redirects for backward compatibility */}
            <Route path="/goldenview" element={<Navigate to="/portao/goldenview" replace />} />
            <Route path="/goldenview/:brokerSlug" element={<Navigate to="/portao/goldenview" replace />} />
            {/* Backup: rota desativada - reativar quando necessário */}
            {/* <Route path="/estanciavelha/privado" element={<EstanciaVelha />} /> */}
            <Route path="/estanciavelha" element={<EstanciaVelhaTeaser />} />
            <Route path="/estanciavelha/bairrodasrosas" element={<BairrodasRosas />} />
            <Route path="/estanciavelha/:brokerSlug" element={<EstanciaVelhaBrokerTeaser />} />
            
            {/* Imóveis Prontos - lead capture for ready-to-move-in properties */}
            <Route path="/prontos" element={<Prontos />} />
            <Route path="/prontos/:brokerSlug" element={<ProntosBrokerPage />} />
            
            {/* NAU - Condomínio Náutico em Osório */}
            <Route path="/osorio/nau" element={<NAULandingPage />} />
            <Route path="/osorio/nau/obrigado" element={<NAULandingPage />} />
            <Route path="/osorio/nau/termos" element={<TermosNAU />} />
            <Route path="/osorio/nau/:brokerSlug" element={<NAUBrokerLandingPage />} />
            
            {/* Mônaco Grand Marina - Condomínio Náutico em Xangri-lá */}
            <Route path="/xangrila/monaco" element={<MonacoLandingPage />} />
            <Route path="/xangrila/monaco/obrigado" element={<MonacoLandingPage />} />
            <Route path="/xangrila/monaco/termos" element={<TermosMonaco />} />
            
            {/* Vivapark Porto Belo — multilingual investment landing */}
            <Route path="/portobelo/vivapark" element={<VivaParkLandingPage />} />
            <Route path="/portobelo/vivapark/obrigado" element={<VivaParkLandingPage />} />
            <Route path="/portobelo/vivapark/termos" element={<TermosVivaPark />} />
            <Route path="/portobelo/vivapark/:brokerSlug/obrigado" element={<VivaParkBrokerLandingPage />} />
            <Route path="/portobelo/vivapark/:brokerSlug" element={<VivaParkBrokerLandingPage />} />
            
            {/* NC-1 — Lofts Duplex no Vivapark Porto Belo */}
            <Route path="/portobelo/nc1" element={<NC1LandingPage />} />
            <Route path="/portobelo/nc1/obrigado" element={<NC1LandingPage />} />
            <Route path="/portobelo/nc1/:brokerSlug/obrigado" element={<NC1BrokerLandingPage />} />
            <Route path="/portobelo/nc1/:brokerSlug" element={<NC1BrokerLandingPage />} />
            {/* Legacy redirect */}
            <Route path="/portobelo/asramos" element={<Navigate to="/portobelo/nc1" replace />} />
            <Route path="/portobelo/asramos/:brokerSlug" element={<Navigate to="/portobelo/nc1" replace />} />
            
            {/* Auth and admin routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/corretor/cadastro" element={<BrokerSignup />} />
            <Route path="/corretor/admin" element={<Navigate to="/corretor/crm" replace />} />
            <Route path="/corretor/crm" element={<BrokerAdmin />} />
            <Route path="/corretor/leads" element={<BrokerAdmin />} />
            <Route path="/corretor/empreendimentos" element={<BrokerProjects />} />
            <Route path="/corretor/whatsapp" element={<Navigate to="/corretor/copiloto" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<Admin />} />
            <Route path="/admin/crm" element={<Admin />} />
            <Route path="/admin/leads" element={<Admin />} />
            <Route path="/admin/corretores" element={<Admin />} />
            <Route path="/admin/roletas" element={<Admin />} />
            <Route path="/admin/empreendimentos" element={<Admin />} />
            
            <Route path="/admin/whatsapp" element={<Navigate to="/admin/copiloto" replace />} />
            <Route path="/admin/inbox" element={<AdminInbox />} />
            <Route path="/admin/plantao" element={<AdminPlantao />} />
            <Route path="/admin/agenda" element={<AdminAgenda />} />
            <Route path="/admin/copiloto" element={<AdminCopilotConfig />} />
            <Route path="/corretor/roletas" element={<BrokerRoletasPage />} />
            <Route path="/corretor/inbox" element={<BrokerInbox />} />
            <Route path="/corretor/plantao" element={<BrokerPlantao />} />
            <Route path="/corretor/agenda" element={<BrokerAgenda />} />
            <Route path="/corretor/copiloto" element={<BrokerCopilotConfig />} />
            <Route path="/corretor/perfil" element={<BrokerProfile />} />
            <Route path="/corretor/lead/:leadId" element={<LeadPage />} />
            <Route path="/corretor/:citySlug/:projectSlug" element={<BrokerProjectLanding />} />
            <Route path="/:brokerSlug/:citySlug/:projectSlug" element={<BrokerProjectLanding />} />
            <Route path="/caminhadaonovocondominioev" element={<CaminhadaEV />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/designsystem" element={<DesignSystem />} />
            <Route path="/google-calendar/callback" element={<GoogleCalendarCallback />} />
            
            {/* Dynamic city/project routes - MUST BE AFTER specific routes */}
            <Route path="/:citySlug/:projectSlug" element={<ProjectLandingPage />} />
            <Route path="/:citySlug/:projectSlug/:brokerSlug" element={<ProjectBrokerLandingPage />} />
            
            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
