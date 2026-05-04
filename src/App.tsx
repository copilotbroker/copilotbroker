import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import AppHead from "@/components/AppHead";
import { SaasNavLauncher } from "@/components/SaasNavLauncher";
import { WhiteLabelProvider } from "@/components/WhiteLabelProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import Home from "./pages/Home";
import { LandingRoutes } from "@/components/LandingRoutes";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import Termos from "./pages/Termos";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LeadPage from "./pages/LeadPage";
import CaminhadaEV from "./pages/CaminhadaEV";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import NotFound from "./pages/NotFound";

// Master Panel (super_admin) - lazy loaded
const MasterLayout = lazy(() => import("./components/master/MasterLayout"));
const MasterOverview = lazy(() => import("./pages/master/MasterOverview"));
const MasterOrganizations = lazy(() => import("./pages/master/MasterOrganizations"));
const MasterOrganizationDetail = lazy(() => import("./pages/master/MasterOrganizationDetail"));
const MasterPlans = lazy(() => import("./pages/master/MasterPlans"));
const MasterAudit = lazy(() => import("./pages/master/MasterAudit"));
const MasterLogin = lazy(() => import("./pages/master/MasterLogin"));

// Admin Org (tenant owner/admin) - lazy loaded
const AdminOrganization = lazy(() => import("./pages/admin-org/AdminOrganization"));
const AdminOrganizationTeam = lazy(() => import("./pages/admin-org/AdminOrganizationTeam"));
const AdminOrganizationPermissions = lazy(() => import("./pages/admin-org/AdminOrganizationPermissions"));
const AdminOrganizationBranding = lazy(() => import("./pages/admin-org/AdminOrganizationBranding"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const OrgPublicSignup = lazy(() => import("./pages/OrgPublicSignup"));
const OrgBrokerPublicSignup = lazy(() => import("./pages/OrgBrokerPublicSignup"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OrganizationProvider>
              <AppHead />
              <WhiteLabelProvider />
              <SaasNavLauncher />
              <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Landing pages — root prefix (legacy URLs, e.g. onovocondominio.com.br/estanciavelha) */}
            {LandingRoutes({ prefix: "" })}

            {/* Landing pages — org-scoped URLs (e.g. copilotbroker.lovable.app/enoveimobiliaria/estanciavelha) */}
            {LandingRoutes({ prefix: ":orgSlug" })}


            {/* Auth and admin routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/corretor/cadastro" element={<BrokerSignup />} />
            <Route path="/corretor/admin" element={<Navigate to="/corretor/crm" replace />} />
            <Route path="/corretor/dashboard" element={<BrokerDashboard />} />
            <Route path="/corretor/crm" element={<BrokerAdmin />} />
            <Route path="/corretor/leads" element={<BrokerAdmin />} />
            <Route path="/corretor/empreendimentos" element={<BrokerProjects />} />
            <Route path="/corretor/whatsapp" element={<Navigate to="/corretor/copiloto" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/crm" replace />} />
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
            {/* /:brokerSlug/:citySlug/:projectSlug is registered inside LandingRoutes (broker-first dynamic) */}
            <Route path="/caminhadaonovocondominioev" element={<CaminhadaEV />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/designsystem" element={<DesignSystem />} />
            <Route path="/google-calendar/callback" element={<GoogleCalendarCallback />} />

            {/* Master Panel — super_admin only. Login dedicado e separado de /auth */}
            <Route path="/master/login" element={<Suspense fallback={null}><MasterLogin /></Suspense>} />
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
            <Route path="/admin/organizacao/branding" element={<Suspense fallback={null}><AdminOrganizationBranding /></Suspense>} />

            {/* Aceite de convite (público após login) */}
            <Route path="/convite/aceitar" element={<Suspense fallback={null}><AcceptInvite /></Suspense>} />

            {/* Cadastro público de imobiliária e corretor */}
            <Route path="/imobiliaria/cadastro" element={<Suspense fallback={null}><OrgPublicSignup /></Suspense>} />
            <Route path="/imobiliaria/:slug/cadastro" element={<Suspense fallback={null}><OrgBrokerPublicSignup /></Suspense>} />

            {/* Dynamic city/project routes are inside LandingRoutes() above */}

            
            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </OrganizationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
