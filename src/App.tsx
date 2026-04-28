import { lazy, Suspense } from "react";
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
import Canela from "./pages/Canela";
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
import BrokerDashboard from "./pages/BrokerDashboard";
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
import HantowerLandingPage from "./pages/hantower/HantowerLandingPage";
import SentowerLandingPage from "./pages/sentower/SentowerLandingPage";
import CA2727LandingPage from "./pages/CA2727LandingPage";
import NotFound from "./pages/NotFound";
import NAULandingPage from "./pages/nau/NAULandingPage";
import NAUBrokerLandingPage from "./pages/nau/NAUBrokerLandingPage";
import TermosNAU from "./pages/nau/TermosNAU";
import MonacoLandingPage from "./pages/monaco/MonacoLandingPage";
import MonacoBrokerLandingPage from "./pages/monaco/MonacoBrokerLandingPage";
import TermosMonaco from "./pages/monaco/TermosMonaco";
import VivaParkLandingPage from "./pages/vivapark/VivaParkLandingPage";
import VivaParkBrokerLandingPage from "./pages/vivapark/VivaParkBrokerLandingPage";
import TermosVivaPark from "./pages/vivapark/TermosVivaPark";
import NC1LandingPage from "./pages/vivapark/NC1LandingPage";
import NC1BrokerLandingPage from "./pages/vivapark/NC1BrokerLandingPage";
// Stuttgart — code-split para não pesar no bundle inicial (4.6MB de imagens)
const StuttgartLandingPage = lazy(() => import("./pages/stuttgart/StuttgartLandingPage"));
const StuttgartBrokerLandingPage = lazy(() => import("./pages/stuttgart/StuttgartBrokerLandingPage"));
const StuttgartIvotiV2LandingPage = lazy(() => import("./pages/stuttgart/StuttgartIvotiV2LandingPage"));
const TermosStuttgart = lazy(() => import("./pages/stuttgart/TermosStuttgart"));
import AuraLeganoLandingPage from "./pages/auralegano/AuraLeganoLandingPage";
import AuraLeganoBrokerLandingPage from "./pages/auralegano/AuraLeganoBrokerLandingPage";
import TermosAuraLegano from "./pages/auralegano/TermosAuraLegano";

// Master Panel (super_admin) - lazy loaded
const MasterLayout = lazy(() => import("./components/master/MasterLayout"));
const MasterOverview = lazy(() => import("./pages/master/MasterOverview"));
const MasterOrganizations = lazy(() => import("./pages/master/MasterOrganizations"));
const MasterOrganizationDetail = lazy(() => import("./pages/master/MasterOrganizationDetail"));
const MasterPlans = lazy(() => import("./pages/master/MasterPlans"));
const MasterAudit = lazy(() => import("./pages/master/MasterAudit"));

// Admin Org (tenant owner/admin) - lazy loaded
const AdminOrganization = lazy(() => import("./pages/admin-org/AdminOrganization"));
const AdminOrganizationTeam = lazy(() => import("./pages/admin-org/AdminOrganizationTeam"));
const AdminOrganizationPermissions = lazy(() => import("./pages/admin-org/AdminOrganizationPermissions"));

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
            <Route path="/estanciavelha/ca2727" element={<CA2727LandingPage />} />
            <Route path="/estanciavelha/ca2727/obrigado" element={<CA2727LandingPage />} />
            <Route path="/estanciavelha/hantower" element={<HantowerLandingPage />} />
            <Route path="/estanciavelha/sentower" element={<SentowerLandingPage />} />
            <Route path="/estanciavelha/sentower/obrigado" element={<SentowerLandingPage />} />
            <Route path="/estanciavelha/bairrodasrosas" element={<BairrodasRosas />} />
            <Route path="/canela" element={<Canela />} />
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
            <Route path="/xangrila/monaco/:brokerSlug/obrigado" element={<MonacoBrokerLandingPage />} />
            <Route path="/xangrila/monaco/:brokerSlug" element={<MonacoBrokerLandingPage />} />
            
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

            {/* Jardins de Stuttgart - Condomínio clube em Ivoti (lazy-loaded) */}
            <Route path="/ivoti/stuttgart" element={<Suspense fallback={null}><StuttgartLandingPage /></Suspense>} />
            <Route path="/ivoti/stuttgart/obrigado" element={<Suspense fallback={null}><StuttgartLandingPage /></Suspense>} />
            <Route path="/ivoti/stuttgart/termos" element={<Suspense fallback={null}><TermosStuttgart /></Suspense>} />
            <Route path="/ivoti/stuttgartivoti" element={<Suspense fallback={null}><StuttgartIvotiV2LandingPage /></Suspense>} />
            <Route path="/ivoti/stuttgartivoti/obrigado" element={<Suspense fallback={null}><StuttgartIvotiV2LandingPage /></Suspense>} />
            <Route path="/ivoti/stuttgart/:brokerSlug/obrigado" element={<Suspense fallback={null}><StuttgartBrokerLandingPage /></Suspense>} />
            <Route path="/ivoti/stuttgart/:brokerSlug" element={<Suspense fallback={null}><StuttgartBrokerLandingPage /></Suspense>} />

            {/* Aura Legano - Loteamento de alto padrão em Nova Santa Rita */}
            <Route path="/novasantarita/auralegano" element={<AuraLeganoLandingPage />} />
            <Route path="/novasantarita/auralegano/obrigado" element={<AuraLeganoLandingPage />} />
            <Route path="/novasantarita/auralegano/termos" element={<TermosAuraLegano />} />
            <Route path="/novasantarita/auralegano/:brokerSlug/obrigado" element={<AuraLeganoBrokerLandingPage />} />
            <Route path="/novasantarita/auralegano/:brokerSlug" element={<AuraLeganoBrokerLandingPage />} />

            {/* Auth and admin routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/corretor/cadastro" element={<BrokerSignup />} />
            <Route path="/corretor/admin" element={<Navigate to="/corretor/dashboard" replace />} />
            <Route path="/corretor/dashboard" element={<BrokerDashboard />} />
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

            {/* Master Panel — super_admin only */}
            <Route path="/master" element={<Navigate to="/master/overview" replace />} />
            <Route path="/master/*" element={<Suspense fallback={null}><MasterLayout /></Suspense>}>
              <Route path="overview" element={<Suspense fallback={null}><MasterOverview /></Suspense>} />
              <Route path="imobiliarias" element={<Suspense fallback={null}><MasterOrganizations /></Suspense>} />
              <Route path="imobiliarias/:id" element={<Suspense fallback={null}><MasterOrganizationDetail /></Suspense>} />
              <Route path="planos" element={<Suspense fallback={null}><MasterPlans /></Suspense>} />
              <Route path="auditoria" element={<Suspense fallback={null}><MasterAudit /></Suspense>} />
            </Route>

            {/* Admin da Imobiliária (tenant) */}
            <Route path="/admin/organizacao" element={<Suspense fallback={null}><AdminOrganization /></Suspense>} />
            <Route path="/admin/organizacao/equipe" element={<Suspense fallback={null}><AdminOrganizationTeam /></Suspense>} />
            <Route path="/admin/organizacao/permissoes" element={<Suspense fallback={null}><AdminOrganizationPermissions /></Suspense>} />

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
